import numpy as np

from nltk.tokenize import TreebankWordTokenizer

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
        token_set = set(doc['description_tokens'])
        for token in token_set:
            if token not in dic:
                dic[token] = [(idx, doc['description_tokens'].count(token))]
            else:
                dic[token].append((idx, doc['description_tokens'].count(token)))
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
    """
    Calculates the dot product scores between a query and documents in an index.

    Args:
        query_word_counts (dict): A dictionary containing the word counts of the query.
        index (dict): A dictionary containing the index of documents and their word counts.
        idf (dict): A dictionary containing the inverse document frequency (idf) values for each word.

    Returns:
        dict: A dictionary containing the accumulated dot product scores for each document in the index.
    """
    dic = {}
    for word, count in query_word_counts.items():
        if word in index and word in idf:
            query_tf = count * idf[word]

            for id, doc_tf in index[word]:
                product = query_tf * (doc_tf * idf[word])

                if id in dic:
                    dic[id] += product
                else:
                    dic[id] = product
    return dic


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

    q_counts = {}
    for q in query_token:
        q_counts[q] = q_counts.get(q, 0) + 1
    
    q_tf_idf = {word: count * idf.get(word, 0) for word, count in q_counts.items()}

    q_norm = np.sqrt(sum(value ** 2 for value in q_tf_idf.values()))

    dot_scores = score_func(q_counts, index, idf)

    res = []

    for id, numerator in dot_scores.items():
        denominator = q_norm * doc_norms[id]
        if denominator:
            score = numerator / denominator
            res.append((score, id))
    res.sort(key = lambda x: -x[0])

    return res


# for id, numerator in dot_scores.items():
#         denominator = q_norm * doc_norms[id]
#         # Make sure denominator is a scalar and not zero
#         if np.isscalar(denominator) and denominator > 0:
#             score = numerator / denominator
#             res.append((score, id))
#         elif isinstance(denominator, np.ndarray):
#         # If it's an array, check if it has a single value
#             if denominator.size == 1 and denominator.item() > 0:
#                 score = numerator / denominator.item()
#                 res.append((score, id))