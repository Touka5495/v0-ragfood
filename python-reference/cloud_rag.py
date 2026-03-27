import os
import json
from dotenv import load_dotenv
from upstash_vector import Index
from groq import Groq  # <-- See? It goes right here at the top!

load_dotenv()
index = Index.from_env()
client = Groq()  # <-- We initialize the Groq client here

def upload_data():
    with open("../data/foods.json", "r", encoding="utf-8") as f:
        foods = json.load(f)
        
    for i, food in enumerate(foods):
        # We just pass the raw text, Upstash handles the embedding!
        text_data = f"{food.get('name', '')} - {food.get('description', '')}"
        index.upsert(vectors=[{"id": str(i), "data": text_data, "metadata": food}])
        
    print(f"Successfully uploaded {len(foods)} items!")

def ask_question(query):
    try:
        # 1. Search Upstash using raw text
        results = index.query(data=query, top_k=3, include_metadata=True)
        
        # 2. Format the context
        context = "\n".join([f"{r.metadata.get('name')}: {r.metadata.get('description')}" for r in results])
        
        # 3. Ask Groq
        prompt = f"Use this context to answer the question.\nContext: {context}\n\nQuestion: {query}\nAnswer:"
        
        response = client.chat.completions.create(
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        print(f"\nQuestion: {query}")
        print(f"Answer: {response.choices[0].message.content}")
        
    except Exception as e:
        print(f"Did you mess up the API key?: {e}")

if __name__ == "__main__":
    # upload_data()
    test_queries = [
        "Healthy Mediterranean options",
        "Nutritious plant-based meals",
        "Light seafood dinners",
        "Spicy vegetarian Asian dishes",
        "High-protein dairy-free breakfasts",
        "Sweet gluten-free desserts",
        "High-protein low-carb foods",
        "Meals packed with dietary fiber",
        "Low-sodium dinner options",
        "Traditional comfort foods",
        "Authentic Thai street food",
        "Classic Italian pasta dishes",
        "Dishes that can be grilled outside",
        "Meals that can be made in an air fryer or rice cooker",
        "Slow-cooked hearty stews"
    ]
    for q in test_queries:
        ask_question(q)