from indexify import indexify_function, Graph, RemoteGraph
from typing import List, Dict

import json
from pydantic import BaseModel


@indexify_function()
def fetch_news_urls(topic: str, num_articles: int = 5) -> List[str]:
    import requests

    # Use a news API to fetch article URLs (replace with actual API call)
    response = requests.get(
        f"https://newsapi.org/v2/everything?q={topic}&pageSize={num_articles}&apiKey=YOUR_API_KEY"
    )
    articles = response.json()["articles"]
    return [article["url"] for article in articles]


class Article(BaseModel):
    url: str
    title: str
    key_sentences: List[str]
    sentiment: float


@indexify_function()
def scrape_and_extract(url: str) -> Article:
    import requests
    from bs4 import BeautifulSoup
    import nltk
    from textblob import TextBlob

    nltk.download("punkt", quiet=True)

    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")

    title = soup.find("h1").text.strip()
    content = " ".join([p.text for p in soup.find_all("p")])

    # Extract key sentences
    sentences = nltk.sent_tokenize(content)
    key_sentences = sentences[:3]  # Simplification: just take first 3 sentences

    # Perform sentiment analysis
    blob = TextBlob(content)
    sentiment = blob.sentiment.polarity

    return Article(
        url=url,
        title=title,
        key_sentences=key_sentences,
        sentiment=sentiment,
    )


@indexify_function()
def generate_summary(data: Article) -> str:
    from openai import OpenAI

    # Prepare the input for GPT
    articles_info = f"Title: {data.title}\nKey points: {' '.join(data.key_sentences)}\nSentiment: {'Positive' if data.sentiment > 0 else 'Negative' if data.sentiment < 0 else 'Neutral'}"

    prompt = f"Summarize the following news articles and provide an overall sentiment analysis:\n\n{articles_info}"

    client = OpenAI(api_key="YOUR_OPENAI_API_KEY")
    completion = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "system",
                "content": "You are a helpful assistant that summarizes news articles and provides sentiment analysis.",
            },
            {"role": "user", "content": prompt},
        ],
    )
    return completion.choices[0].message.content or ""


# Create the graph
g: Graph = Graph(name="news-analyzer", start_node=fetch_news_urls)
g.add_edge(fetch_news_urls, scrape_and_extract)
g.add_edge(scrape_and_extract, generate_summary)

# Example usage
if __name__ == "__main__":
    remote_graph = RemoteGraph.deploy(g, server_url="http://localhost:8900")

    graph = RemoteGraph.by_name(
        name="news-analyzer", server_url="http://localhost:8900"
    )

    invocation_id = graph.run(
        block_until_done=True, topic="artificial intelligence", num_articles=5
    )

    results = graph.get_output(invocation_id, fn_name="generate_summary")

    print(results)
