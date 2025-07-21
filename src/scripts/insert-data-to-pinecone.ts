import FirecrawlApp from "@mendable/firecrawl-js";
import dotenv from "dotenv";
import { Logger } from "@/utils/logger";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const ai = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
// baseURL: "https://generativelanguage.googleapis.com/v1beta",);
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

const logger = new Logger("InsertDataToPinecone");

async function main() {
  try {
    const app = new FirecrawlApp({
      apiKey: process.env.FIRECRAWL_API_KEY,
    });

    const scrapeURLs = [
      "https://www.aven.com",
      "https://www.aven.com/support",
      "https://www.aven.com/about",
      "https://www.aven.com/education",
    ];

    const scrapeResults: { url: string; content: string }[] = [];

    for (const scrapeURL of scrapeURLs) {
      const result = await app.scrapeUrl(scrapeURL, {
        formats: ["markdown"],
        onlyMainContent: true,
      });

      if (!result?.success || !result.markdown) {
        logger.error(`Failed to scrape content from ${scrapeURL}`);
        continue;
      }

      scrapeResults.push({ url: scrapeURL, content: result.markdown });
      logger.info(`Successfully scraped content from ${scrapeURL}`);
    }

    if (scrapeResults.length === 0) {
      throw new Error("No content was successfully scraped from any URL.");
    }

    const model = ai.getGenerativeModel({ model: "gemini-embedding-001" });
    const namespace = pc.index("company-data").namespace("aven");

    // Split markdown into chunks of roughly 1000 characters
    const chunkSize = 1000;
    type ChunkData = { chunk: string; sourceUrl: string };
    const chunks: ChunkData[] = [];

    for (const result of scrapeResults) {
      for (let i = 0; i < result.content.length; i += chunkSize) {
        const chunk = result.content.substring(i, i + chunkSize);
        chunks.push({ chunk, sourceUrl: result.url });
      }
    }

    const cleanText = (text: string): string => {
      return text
        .replace(/https?:\/\/[^\s]+/g, "") // Remove URLs
        .replace(/\s+/g, " ") // Replace multiple spaces with single space
        .trim();
    };

    const upsertRequests = await Promise.all(
      chunks.map(async (chunk, index) => {
        if (chunk.chunk.length > 0) {
          const cleanedChunk = cleanText(chunk.chunk);
          if (cleanedChunk.length === 0) return;

          const result = await model.embedContent(cleanedChunk);
          logger.info(
            `Generated embedding ${index + 1}/${chunks.length} with dimensions:`,
            result.embedding.values.length
          );
          return {
            id: `${chunk.sourceUrl}-${Date.now()}-${index}`,
            values: result.embedding.values,
            metadata: {
              chunk_text: cleanedChunk,
              original_text: chunk.chunk,
              category: "website",
              url: chunk.sourceUrl,
            },
          };
        }
      })
    ).then(requests =>
      requests.filter(
        (req): req is NonNullable<typeof req> => req !== undefined
      )
    );

    const pineconeResponse = await namespace.upsert(upsertRequests);
    logger.info("Pinecone response:", pineconeResponse);
  } catch (error) {
    logger.error("Error in main function:", error);
    throw error;
  }
}

main().catch(error => {
  logger.error("Failed to execute main function:", error);
  process.exit(1);
});
