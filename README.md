Aven Voice Customer Service Agent
Project Overview
This project delivers a sophisticated web application designed to provide AI-powered voice customer service. Leveraging cutting-edge conversational AI and Retrieval-Augmented Generation (RAG), the application allows users to call and speak to an intelligent agent capable of answering account-specific questions and adhering to company guidelines. The primary goal is to automate customer support for FinTech operations, enhancing efficiency and user experience.

A key component of this system is an admin dashboard that offers insights into call analytics and frequently asked questions, enabling continuous improvement and operational oversight.

Features
Voice-Enabled Interaction: Users can initiate calls directly from the web application and speak naturally with the AI agent.

Intelligent Account-Based Responses: The AI assistant provides accurate and relevant answers by referencing user-specific information and company guidelines.

Retrieval-Augmented Generation (RAG): Ensures responses are grounded in factual data and adhere to predefined company policies by retrieving information from a knowledge base.

Real-time Processing: Designed for quick response times to facilitate smooth and natural conversations.

Admin Dashboard: A dedicated interface for administrators to view analytics on call volume, common queries, and other operational metrics.

Technologies Used
Web Framework: Next.js

Voice Interface: Vapi Widget - Handles real-time voice-to-text and text-to-speech.

Large Language Model (LLM): Google Gemini - Powers the conversational AI for understanding user queries and generating responses.

Vector Database: Pinecone - Stores vectorized knowledge base content for efficient RAG.

Data Ingestion: Custom URLScraper - Used to extract and process information from Aven (FinTech company) for populating the knowledge base.

Programming Languages: Typescript, 


Architecture & How It Works
The system operates on a robust architecture designed for real-time conversational AI:

User Interaction: A user initiates a call via the web application's interface.

Voice Processing (Vapi Widget): Vapi handles the real-time conversion of user speech to text and streams it to the backend.

Knowledge Retrieval (RAG):

The user's text query, along with relevant user account context (if applicable), is sent to the backend.

A custom URLScraper was used to ingest publicly available information from Aven (e.g., FAQs, product details) and potentially internal guidelines into Pinecone, where it's stored as vector embeddings.

The system performs a similarity search in Pinecone to retrieve the most relevant information from the knowledge base based on the user's query.

AI Response Generation (Google Gemini):

The retrieved context, the user's query, and a pre-defined system prompt (ensuring adherence to company guidelines) are fed into the Google Gemini LLM.

Gemini generates a natural language response.

Voice Synthesis & Delivery (Vapi Widget): The AI's text response is sent back to Vapi, which converts it into speech and delivers it to the user in real-time.

Analytics & Monitoring: All call interactions, including questions asked and AI responses, are logged and processed to populate the admin dashboard, providing valuable insights into user behavior and common inquiries.

Setup & Installation
To set up and run this project locally:

Clone the repository:

git clone https://github.com/MarcusGale/AI-Customer-Agent
cd ai-customer-service-agent

Install Dependencies: npm i


For [Frontend Language, e.g., Node.js/npm/yarn]: npm install or yarn install

Environment Variables: Create a .env file in the root directory and configure the following:

VAPI_API_KEY=your_vapi_api_key
GEMINI_API_KEY=your_gemini_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment

Knowledge Base Setup:

Run the URLScraper script to ingest data into Pinecone. (Provide specific instructions/script name here, e.g., python scripts/ingest_aven_data.py)

Run the Application:

Start the backend server: ngrok http 3000

Start the frontend application: npm run dev

Usage
Navigate to the deployed web application URL or your local development server (http://localhost:[port]).

Click the "Call AI Agent" button.

Speak your questions regarding account information or general company guidelines.

Listen for the AI's real-time voice responses.

Admin Dashboard
Access the admin dashboard (e.g., http://localhost:3000/dashboard) to view:

Total call volume

Average call duration

Breakdown of frequently asked questions

Insights into common user pain points

Future Enhancements (Optional Section)
Implement sentiment analysis to gauge user satisfaction during calls.

Expand RAG capabilities to pull from diverse internal data sources (e.g., CRM, ticketing systems).

Add multi-language support for the AI agent.

Integrate with live agent handover for complex queries.
