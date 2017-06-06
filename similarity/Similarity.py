import numpy as np


def compute_jaccard_coeff(items_a, items_b):
    # find the intersection
    intersection = set(items_a) & set(items_b)
    intersection_length = len(intersection)

    # return the Jaccard coefficient: ( |A /\ B| / (|A| + |B| -|A /\ B|) )
    return float(intersection_length) / float((len(items_a) + len(items_b) - intersection_length))


def compute_tanimoto_coeff(vector_a, vector_b):
    a_dot_b = np.dot(vector_a, vector_b)

    mag_a = np.linalg.norm(vector_a)
    mag_b = np.linalg.norm(vector_b)

    # denominator is zero, no similarity
    if (mag_a * mag_a + mag_b * mag_b - a_dot_b) == 0:
        return 0

    # return the Tanimoto coefficient: ( (A dot B) / (|A|^2 + |B|^2 - (A dot B)) )
    tanimoto_coeff = a_dot_b / (mag_a * mag_a + mag_b * mag_b - a_dot_b)
    # print tanimoto_coeff

    return tanimoto_coeff
