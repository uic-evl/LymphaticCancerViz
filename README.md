# LymphaticCancerViz

#### Overview
This project visualizes the chain of affected lymph nodes for patients in a cohort of head and neck cancer patients, ranked by disease spread similarity. This specific project is part of a larger project which aims to predict risk of post-treatment side effects for patients after successful radiation treatment.

This project includes an unsupervised machine learning approach, which builds on a novel way of measuring the similarity between patients' lymph node disease spread. We've performed hierarchical clustering using this similarity measure.

##### The Interface
The Visualization is written in javascript and can be viewed in the browser. Because of the sensitive nature of the data, only a synthetically-generated dataset is available for public viewing.

Upon loading the interface, the user can select the patient to view, based on patient ID or cluster membership. When an ID is selected, we show the affected nodes of that patient, followed by the remaining patients in the dataset, in order of similarity. When cluster membership is selected, the user can view the results of clustering using different metrics. Users can examine clusters generated using a fixed number (6) of clusters, or clusters with only identical or extremely similar patterns. Because the data in this repo is synthetically generated, the clusters should show no correlation with toxicity.

##### The Data
This repo currently uses synthetic data, located in the synthetic_data folder. The data was synthetically derived from the original cohort of 582 anonymized patients who have received treatment at the MD Anderson Cancer Center.  All samples in the synthetic dataset were randomly sampled from the distribution of data found in the original cohort. Specifically, affected lymph nodes were chosen randomly from the combinations present in the original cohort. The sampling probability was further weighed by the number of involved nodes so that larger, less common patterns are sampled. The synthetic data was generated to give an accurate idea of how the code and visualization works, but is not conducive to meaningful statistical insight. 

Given the sampling method, the data is likely to be biased towards having more of the common patterns and is likely missing several rare patterns of affected lymph nodes in the original cohort. Furthermore, any causal relationship between variables won't be reflected in the synthetic dataset, given that they were all sampled independently. 

Clustering results using the original methodology are also  included in the synthetic data. Because the data is synthetic, the resulting clusters do not correlate with any outcome (and should not). Because of our biased sampling strategy, the clusters are furthermore biased in their distribution.

For an explanation of the dataset format, see [here](https://github.com/uic-evl/LymphaticCancerViz/blob/master/synthetic_data/CohortAnalysis.ipynb)
