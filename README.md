# LymphaticCancerViz

#### Overview
This project visualizes the chain of lymph nodes for patients in a cohort of head and neck cancer patients.
Spread to Lymph nodes is a general predictor of patient survival in these cases.  
This is part of a larger project to extend this to predict risk of post-treatment side effects for patients after successful radiation treatment.

This project also includes an unsupervised machine learning approach, where we have created ways of measuring the similarity between patients patients and lymph nodes.
We've performed clustering using this similarity metric.

##### The Interface
The Visualization is done in javascript and can be viewed in the browser.  Because of the sensitive nature of the data, only a synthetic dataset is avaliable for public viewing.

Upon loading the user can select patients to view based on id or cluster. 
For ID, we show the affected nodes of the patient, followed by the patients in order of similarity.

For clustering, the user can view the results of clustering using different metrics.  Users can look at these clusters based on when we use a set number (6) of clusters, or clusters with only identical or extremely similar patterns.
Because the data in this repo is synthetically generated, the clusters should show no correlation with toxicity.

##### The Data
This repo currently uses synthetic data, located in the synthetic_data folder of the repo, based on a private cohort of 583 anonymized patients treated at the MD Anderson cancer center.  
All features were randomly sampled from the original distribution of data found in the original cohort.  Affected lymph nodes were chosen randomly from the combinations of affected nodes, with their sample probility further weighted by the number of involved nodes so that larger, less common patterns are sampled.
Given the sampling method, the data is likely to be biased towards having more of the common patterns and is likely missing several rare patterns of affected lymph nodes in the original cohort.  
Any causal relationship between variables won't be reflected in the sample dataset, given that they were all sampled independently. Clustering results using the original methodology are included in the synthetic data, but wouldn't show the sample correlation with outcomes and are biased towards inbalanced clusters.

For a demo of what the dataset look like, see [here](https://github.com/uic-evl/LymphaticCancerViz/blob/master/synthetic_data/CohortAnalysis.ipynb)
