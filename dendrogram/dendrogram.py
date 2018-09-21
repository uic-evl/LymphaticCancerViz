from matplotlib import pyplot as plt
from scipy.cluster import hierarchy
from scipy.cluster.hierarchy import dendrogram, linkage
import scipy.spatial
import json
import numpy as np
import sys
import pandas as pd

#https://joernhees.de/blog/2015/08/26/scipy-hierarchical-clustering-and-dendrogram-tutorial/


# Create a nested dictionary from the ClusterNode's returned by SciPy
def add_node(node, parent):
    # First create the new node and append it to its parent's children
    newNode = dict( node_id=node.id, children=[] )
    parent["children"].append( newNode )

    # Recursively add the current node's children
    if node.left: add_node( node.left, newNode )
    if node.right: add_node( node.right, newNode )


# Label each node with the names of each leaf in its subtree
def label_tree( n ):
    # If the node is a leaf, then we have its name
    if len(n["children"]) == 0:
        leafNames = [ id2name[n["node_id"]] ]

    # If not, flatten all the leaves in the node's subtree
    else:
        leafNames = reduce(lambda ls, c: ls + label_tree(c), n["children"], [])

    # Delete the node id since we don't need it anymore and
    # it makes for cleaner JSON
    del n["node_id"]

    # Labeling convention: "-"-separated leaf names
    n["name"] = name = "-".join(sorted(map(str, leafNames)))

    return leafNames

similarity_matrix_file = sys.argv[1]
similarity_matrix = pd.read_csv(similarity_matrix_file, index_col=False, usecols=range(1,584))

labels = np.asarray(range(1, 584))
id2name = dict(zip(range(len(labels)), labels))

Z = linkage(similarity_matrix, 'weighted')

# Example data: gene expression
# geneExp = {'genes' : ['a', 'b', 'c', 'd', 'e', 'f'],
#      	   'exp1': [-2.2, 5.6, 0.9, -0.23, -3, 0.1],
# 	   'exp2': [5.4, -0.5, 2.33, 3.1, 4.1, -3.2]
#           }
# df = pd.DataFrame( geneExp )

# Create dictionary for labeling nodes by their IDs
# labels = list(df.genes)
# id2name = dict(zip(range(len(labels)), labels))

# Determine distances (default is Euclidean)
# dataMatrix = np.array( df[['exp1', 'exp2']] )
# distMat = scipy.spatial.distance.pdist( dataMatrix )
#
# # Cluster hierarchicaly using scipy
# clusters = scipy.cluster.hierarchy.linkage(distMat, method='single')


plt.figure(figsize=(25, 10))
plt.title('Hierarchical Clustering Dendrogram')
plt.xlabel('sample index')
plt.ylabel('distance')

tree = dendrogram(
    Z,
    truncate_mode='lastp',
    p=25,
    leaf_rotation=90.,  # rotates the x axis labels
    leaf_font_size=8,  # font size for the x axis labels
    color_threshold=5.4,
    labels=labels, orientation='right'
)

T = hierarchy.to_tree( Z , rd=False )
d3Dendro = dict(children=[], name="Root1")
add_node( T, d3Dendro )
label_tree( d3Dendro["children"][0] )
json.dump(d3Dendro, open("d3-dendrogram.json", "w"), sort_keys=True, indent=4)


plt.show()