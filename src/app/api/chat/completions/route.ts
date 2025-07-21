import OpenAI from "openai";
import { Logger } from "@/utils/logger";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/config/env";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";

const logger = new Logger("API:Chat");
const pinecone = new Pinecone({ apiKey: env.PINECONE_API_KEY });
const namespace = pinecone.index("company-data").namespace("aven");
const ai = new GoogleGenerativeAI(env.GOOGLE_API_KEY!);
const embeddingModel = ai.getGenerativeModel({ model: "gemini-embedding-001" });

const gemini = new OpenAI({
  apiKey: env.GOOGLE_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta",
});

export async function POST(req: NextRequest) {
  if (req.method !== "POST") {
    return NextResponse.json({ message: "Not Found" }, { status: 404 });
  }

  try {
    //first we must await the request

    const body = await req.json();
    logger.info("Received request body:", {
      hasMessages: !!body.messages,
      statusCode: 200,
    });
    //destructuring the request body
    const {
      model,
      messages,
      max_tokens,
      temperature,
      stream,
      call,
      ...restParams
    } = body;
    //Validate required parameters
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required and cannot be empty." },
        { status: 400 }
      );
    }

    const lastMessage = messages?.[messages.length - 1];
    if (!lastMessage?.content) {
      return NextResponse.json(
        { error: "Last message content is required." },
        { status: 400 }
      );
    }

    logger.info("Creating prompt modification...");

    // const pinecone = new Pinecone({ apiKey: env.PINECONE_API_KEY });
    // const index = pinecone.index("company-data");
    // const namespace = index.namespace("aven");
    const query = lastMessage.content;

    logger.info("Query:", query);
    const embedding = await embeddingModel.embedContent(query);
    logger.info("Embedding:", embedding);
    // Search for relevant records in Pinecone
    const response = await namespace.query({
      vector: embedding.embedding.values,
      topK: 2,
      includeMetadata: true,
      // includeValues: true,
    });

    logger.info("Pinecone query response:", response);

    const context = response.matches
      ?.map(match => match.metadata?.chunk_text)
      .join("\n");

    logger.info("Context:", context);

    const geminiPrompt = `Answer my question based on the following context:
    
    ${context}

    Question: ${query}
      Answer:`;
    // Create a prom pt modification using Gemini
    const prompt = await gemini.chat.completions.create({
      model: "gemini-2.0-flash-lite",
      // A list of messages that make up the conversation so far.
      messages: [
        {
          role: "user",

          content: `
        Create a prompt which can act as a prompt templete where I put the original prompt and it can modify it according to my intentions so that the final modified prompt is more detailed.You can expand certain terms or keywords.
        ----------
        PROMPT: ${lastMessage.content}
        MODIFIED PROMPT: `,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const modifiedContent = prompt.choices[0]?.message?.content;
    if (!modifiedContent) {
      return NextResponse.json(
        { error: "Failed to generate modified prompt." },
        { status: 500 }
      );
    }

    const modifiedMessages = [
      ...messages.slice(0, messages.length - 1),
      { ...lastMessage, content: prompt.choices[0].message.content },
    ];

    logger.info("Creating completion...", {
      stream,
      messagesCount: modifiedMessages.length,
    });

    if (stream) {
      const completionStream = await gemini.chat.completions.create({
        model: "gemini-2.0-flash-lite",
        messages: modifiedMessages,
        max_tokens: max_tokens || 150,
        temperature: temperature || 0.7,
        stream: true,
      } as OpenAI.Chat.ChatCompletionCreateParamsStreaming);

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of completionStream) {
              const data = `data: ${JSON.stringify(chunk)}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          } catch (error) {
            logger.error("Error in streaming completion:", error);
            controller.error(error);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } else {
      //Handle non-streaming completion
      const completion = await gemini.chat.completions.create({
        model: model || "gemini-2.0-flash-lite",
        messages: modifiedMessages,
        max_tokens: max_tokens || 150,
        temperature: temperature || 0.7,
        stream: false,
      });

      logger.info("Completeion created successfully");
      return NextResponse.json(completion);
    }
  } catch (error) {
    logger.error("API error:", error);

    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `API Error: ${error.message}`, code: error.code },
        { status: error.status || 500 }
      );
    }
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
