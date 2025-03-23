# 💰 AI-Powered Financial Advisor Coinscious

**An intelligent personal finance assistant powered by AI — helping users track spending, detect fraud, simulate transactions, and receive personalized financial insights in real time.**

---

## 🚀 Inspiration

Financial illiteracy is a widespread problem, especially among younger generations. According to the **National Financial Educators Council**, the average U.S. adult lost **$1,819 in 2022** due to poor financial knowledge. Meanwhile, a **2023 FINRA survey** revealed that nearly **two-thirds of Americans cannot pass a basic financial literacy test**.

The problem is systemic — most young adults don’t receive proper financial education until they are already facing real-world responsibilities like budgeting, taxes, or debt. To make things worse, hiring a professional accountant or financial advisor is often unaffordable, with rates ranging from **$150 to $400/hour**.

We built this app to offer an accessible, 24/7 AI-powered alternative — an accountant you can carry in your pocket.

---

## 💡 What It Does

This project serves as a **personal AI accountant and financial advisor** that follows the user anywhere. Users can chat with an intelligent agent that:

- Analyzes past transactions by category
- Simulates sending money to other users
- Detects potential fraud based on transaction patterns
- Offers personalized financial insights using age, interests, and user history
- Retrieves current financial news and trends using Retrieval-Augmented Generation (RAG)

---

## 🧱 Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) – for a responsive UI and chat experience  
- **Backend**: [Flask](https://flask.palletsprojects.com/) – to handle AI logic and DB interactions  
- **Database**: [Supabase](https://supabase.com/) – user profiles, transactions, wallets  
- **AI Agent**: [LangChain](https://www.langchain.com/) + [Gemmini (2.0 Flash)](https://gemini.google.com/)  
- **Vector Search**: [Pinecone](https://www.pinecone.io/) – powers RAG for trend insights  
- **Embedding & Retrieval**: Retrieval-Augmented Generation (RAG)

---

## ❌ Challenges We Faced

- **LangChain Learning Curve**: Our first time building tools, memory, and multi-tool agents  
- **RAG Integration**: Wrapping our heads around vectorization and Pinecone took time  
- **Pinecone Setup**: Authentication and document retrieval setup was tricky  
- **Tool Chaining**: Ensuring the agent could reason about and properly use tools with live data  
- **Framework Overload**: Many of the frameworks (LangChain, Supabase, Pinecone) were new to us

---

## 🏆 Accomplishments We're Proud Of

- Created a real AI agent that behaves like a financial assistant  
- Integrated GPT, LangChain, and Supabase for intelligent decision-making  
- Simulated real financial workflows (like sending money) through backend logic  
- Used RAG to deliver up-to-date insights about financial spending  
- Delivered a polished, chat-based interface to interact with AI tools

---

## 📖 What We Learned

- How to implement multi-tool LangChain agents with memory and reasoning  
- The fundamentals of vector databases and how RAG works  
- Prompt engineering to guide agent behavior with real user data  
- Secure and efficient financial logic across a full-stack architecture  
- Cross-system integration and agent design in a real-world context

---

## 🚧 What’s Next

- Add savings goals, budgeting tools, and financial reminders  
- Expand RAG to learn from user-specific historical patterns  
- Add better fraud detection models using AI-based anomaly detection  
- Integrate calendar-based financial summaries and planning  
- Polish and deploy for real users to test and iterate on feedback

---

## 🌟 Try It Out

Coming soon — once deployed, you’ll be able to test the agent, send money, analyze spending, and receive insights directly from your dashboard!

---

## 📬 Contact

Want to collaborate, contribute, or learn more? Feel free to reach out to the team or submit an issue!

