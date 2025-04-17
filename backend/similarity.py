import numpy as np
from nltk.tokenize import TreebankWordTokenizer
from nltk.corpus import stopwords
import string
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
from sklearn.metrics.pairwise import cosine_similarity
import joblib
import nltk

try:
    stop_words = set(stopwords.words('english'))
except LookupError:
    nltk.download('stopwords')
    stop_words = set(stopwords.words('english'))

punctuation = set(string.punctuation)

# Initialize the tokenizer
tokenizer = TreebankWordTokenizer()


def build_inverted_index(courses):
    """
    Builds an inverted index from a list of movies.

    Args:
        movies (list): A list of movie dictionaries, where each dictionary contains a 'tokens' key
                       representing the tokens in the movie.

    Returns:
        dict: The inverted index dictionary, where each key is a token and the corresponding value
              is a list of tuples. Each tuple contains the index of the movie in the 'movies' list
              and the count of the token in that movie.
    """
    dic = {}
    for idx, doc in enumerate(courses):
        filtered_tokens = [t for t in doc['description_tokens'] if t.lower() not in stop_words and t not in punctuation]
        token_set = set(filtered_tokens)
        for token in token_set:
            if token not in dic:
                dic[token] = [(idx, filtered_tokens.count(token))]
            else:
                dic[token].append((idx, filtered_tokens.count(token)))
    return dic


def compute_idf(inv_idx, n_docs):
    """
    Compute the inverse document frequency (IDF) for each word in the given inverted index.

    Parameters:
    inv_idx (dict): The inverted index containing words as keys and their appearances as values.
    n_docs (int): The total number of documents.

    Returns:
    dict: A dictionary containing words as keys and their corresponding IDF values.
    """

    res = {}

    for word, appearance in inv_idx.items():
        df = len(appearance)
        df_ratio = df / n_docs
        
        idf = np.log2(n_docs/ (1 + df))
        res[word] = idf
    return res
    

def compute_doc_norms(index, idf, n_docs):
    """
    Compute the document norms based on the given index, inverse document frequency (idf), and number of documents (n_docs).

    Parameters:
    index (dict): A dictionary representing the index of words in the documents.
    idf (dict): A dictionary representing the inverse document frequency of words.
    n_docs (int): The total number of documents.

    Returns:
    numpy.ndarray: An array containing the computed document norms.
    """

    res = np.zeros(n_docs)

    for word, appearance in index.items():
        if word in idf:
            for doc_id, tf in appearance:
                res[doc_id] += (tf * idf[word]) ** 2
    return np.sqrt(res)



def accumulate_dot_scores(query_word_counts, index, idf):
    doc_scores = {}
    contributions = {}

    for word, count in query_word_counts.items():
        if word in index and word in idf:
            query_tf = count * idf[word]
            for doc_id, doc_tf in index[word]:
                contribution = query_tf * (doc_tf * idf[word])
                if doc_id in doc_scores:
                    doc_scores[doc_id] += contribution
                    contributions[doc_id].append((word, contribution))
                else:
                    doc_scores[doc_id] = contribution
                    contributions[doc_id] = [(word, contribution)]

    return doc_scores, contributions


def search(query, index, idf, doc_norms, score_func=accumulate_dot_scores, tokenizer=tokenizer):
    """
    Search for documents based on a given query.

    Args:
        query (str): The query string to search for.
        index (dict): The index of documents.
        idf (dict): The inverse document frequency values.
        doc_norms (dict): The document norms.
        score_func (function, optional): The scoring function to calculate dot scores. Defaults to accumulate_dot_scores.
        tokenizer (function, optional): The tokenizer function to tokenize the query. Defaults to tokenize.

    Returns:
        list: A list of tuples containing the score and document ID for each matching document.
    """
    query = query.lower()
    query_token = tokenizer.tokenize(query)
    query_token = [t for t in query_token if t.lower() not in stop_words and t not in punctuation]

    q_counts = {}
    for q in query_token:
        q_counts[q] = q_counts.get(q, 0) + 1
    
    q_tf_idf = {word: count * idf.get(word, 0) for word, count in q_counts.items()}

    q_norm = np.sqrt(sum(value ** 2 for value in q_tf_idf.values()))

    dot_scores, contributions = score_func(q_counts, index, idf)

    res = []

    for id, numerator in dot_scores.items():
        denominator = q_norm * doc_norms[id]
        if denominator:
            score = numerator / denominator
            res.append((score, id, sorted(contributions.get(id, []), key=lambda x: -x[1])[:5]))

    res.sort(key = lambda x: -x[0])

    return res


def build_semantic_search(courses_list, tokenizer, n_components=100):
    descriptions = [" ".join(course["description_tokens"]) for course in courses_list]

    def custom_tokenizer(text):
        tokens = tokenizer.tokenize(text.lower())
        return [t for t in tokens if t not in stop_words and t not in punctuation]

    vectorizer = TfidfVectorizer(tokenizer=custom_tokenizer)
    X = vectorizer.fit_transform(descriptions)

    svd = TruncatedSVD(n_components=n_components, random_state=42)
    X_reduced = svd.fit_transform(X)

    return vectorizer, svd, X_reduced

def semantic_search(query, vectorizer, svd, X_reduced, courses_list, tokenizer, top_k=10):
    query_vec = vectorizer.transform([query])
    query_reduced = svd.transform(query_vec)

    sims = cosine_similarity(query_reduced, X_reduced)[0]
    top_indices = sims.argsort()[::-1][:top_k]

    results = [(sims[idx], idx) for idx in top_indices]
    return results