from matplotlib import pyplot as plt
from scipy.cluster import hierarchy
from scipy.cluster.hierarchy import dendrogram, linkage
import numpy as np
import sys
import pandas as pd

#https://joernhees.de/blog/2015/08/26/scipy-hierarchical-clustering-and-dendrogram-tutorial/

similarity_matrix_file = sys.argv[1]


similarity_matrix = pd.read_csv(similarity_matrix_file, index_col=False, usecols=range(1,584))

Z = linkage(similarity_matrix, 'weighted')

plt.figure(figsize=(25, 10))
plt.title('Hierarchical Clustering Dendrogram')
plt.xlabel('sample index')
plt.ylabel('distance')

hier = hierarchy.leaves_list(Z)

tree = dendrogram(
    Z,
    truncate_mode='lastp',
    p=25,
    leaf_rotation=90.,  # rotates the x axis labels
    leaf_font_size=8,  # font size for the x axis labels
    color_threshold=5.4
)

plt.show()