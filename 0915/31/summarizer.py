"""TextRank 기반 추출 요약 모듈.

문장을 그래프의 노드로, 문장 간 코사인 유사도를 엣지 가중치로 삼아
PageRank를 돌린 뒤 점수가 높은 문장을 원문 순서대로 추려낸다.
"""
import re

import networkx as nx
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

# 한국어(다./요./니다.)와 영어(마침표/물음표/느낌표) 문장 종결부를 함께 처리한다.
_SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?。！？])\s+")


def split_sentences(text: str) -> list[str]:
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return []
    candidates = _SENTENCE_SPLIT_RE.split(text)
    sentences = [s.strip() for s in candidates if len(s.strip()) >= 2]
    return sentences


def summarize(text: str, num_sentences: int) -> list[str]:
    """TextRank로 상위 num_sentences개 문장을 원문 순서대로 반환한다."""
    sentences = split_sentences(text)
    if len(sentences) <= num_sentences:
        return sentences

    vectorizer = TfidfVectorizer()
    try:
        tfidf = vectorizer.fit_transform(sentences)
    except ValueError:
        # 어휘가 없는 경우(전부 불용어/숫자 등) 앞부분 문장으로 대체
        return sentences[:num_sentences]

    similarity_matrix = (tfidf * tfidf.T).toarray()
    np.fill_diagonal(similarity_matrix, 0)

    graph = nx.from_numpy_array(similarity_matrix)
    try:
        scores = nx.pagerank(graph, max_iter=200)
    except nx.PowerIterationFailedConvergence:
        scores = {i: 1.0 for i in range(len(sentences))}

    ranked_indices = sorted(scores, key=scores.get, reverse=True)[:num_sentences]
    ranked_indices.sort()  # 원문 등장 순서 유지
    return [sentences[i] for i in ranked_indices]
