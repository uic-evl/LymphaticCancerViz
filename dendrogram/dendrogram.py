from matplotlib import pyplot as plt
from scipy.cluster import hierarchy
from scipy.cluster.hierarchy import dendrogram, linkage
import scipy.spatial
import json
import numpy as np
import sys
import pandas as pd

def get_children(root):
    global names
    fringe = [dict( node=root )]
    current = fringe.pop()
    children = []

    while current and current['node']:
        node = current['node']

        if node.left:
            fringe.append(dict( node=node.left ))

        if node.right:
            fringe.append(dict( node=node.right ))

        if not node.left and not node.right:
            children.append(names[node.id].split(" ")[1])

        if len(fringe):
            current = fringe.pop()
        else:
            current = None

    return children


#https://joernhees.de/blog/2015/08/26/scipy-hierarchical-clustering-and-dendrogram-tutorial/
# Create a nested dictionary from the ClusterNode's returned by SciPy
def add_node(node, parent):
    global leaves
    # First create the new node and append it to its parent's children
    newNode = dict( node_id=node.id, children=[], count=node.count, dist=node.dist, cluster=[] )
    parent["children"].append( newNode )

    # Recursively add the current node's children if the node is not a leaf
    if node.dist > 0:
        if node.left: add_node( node.left, newNode )
        if node.right: add_node( node.right, newNode )

    else:
        left_children = get_children(node.left)
        right_children = get_children(node.right)

        newNode['cluster'] = sorted(left_children + right_children)


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

names = similarity_matrix.columns

labels = np.asarray(range(1, 584))
id2name = dict(zip(range(len(labels)), labels))

Z = linkage(similarity_matrix, 'weighted')

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
    labels=labels, orientation='top'
)

T = hierarchy.to_tree( Z , rd=False )
leaves = hierarchy.leaves_list(Z)

d3Dendro = dict(children=[], name="Root1")
add_node( T, d3Dendro )
#label_tree( d3Dendro["children"][0] )
json.dump(d3Dendro, open("d3-dendrogram.json", "w"), sort_keys=True, indent=4)

plt.show()
