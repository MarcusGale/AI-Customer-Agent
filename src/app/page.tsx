import VapiWidget from "./components/VapiWidget";
import { env } from "@/config/env";
export default async function Home() {

  return (
    <div className="min-h-screen bg-white relative font-['Inter',system-ui,-apple-system,sans-serif]">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute transform rotate-12 translate-x-1/4 -translate-y-1/4 top-0 right-0 w-[800px] h-[600px] bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-xl border border-gray-700"></div>
        <div className="absolute transform -rotate-12 -translate-x-1/4 translate-y-1/4 bottom-0 left-0 w-[800px] h-[600px] bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-xl border border-gray-700"></div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="py-24 text-center">
          <h1 className="text-6xl font-bold text-black mb-6 font-inter tracking-tight">
            Aven's Customer Service Agent
          </h1>
          <p className="text-2xl text-black max-w-2xl mx-auto font-inter font-normal tracking-wide">
            How can we help?
          </p>
        </div>
        <div className="flex items-center justify-center mt-8">
          <div className="w-full max-w-3xl">
            <VapiWidget
              apiKey={env.VAPI_PUBLIC_KEY}
              assistantId={env.VAPI_ASSISTANT_ID}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
