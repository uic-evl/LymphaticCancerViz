filename = '../data/clustering_results/weighted_matrix.csv';
dataFile = '../data/clustering_results/Tanimoto_weighted_Data_and_Scores_5_2018.csv';
outFile = '../data/clustering_results/Tanimoto_weighted_Data_and_Scores_5_2018';


% linkage = {'complete','weighted'};
linkage = {'complete'};

% cuts = {{7.4,6,5.85,5.85,5.85,5.85}, {7.4,6,5.85,5.85,5.85,5.85}};
cuts = {{6}};%,{7.8}};
% groups = {{3,4,5,6,7,8},{3,4,5,6,7,8}};
groups = {{6}};%,{6}};

for i=1:length(linkage) 
    link = linkage{i};
    for j=1:length(groups{i})
        k=groups{i}{j};
        cut = cuts{i}{j}; 
        clusterLymphSim (link, k, cut, filename, dataFile, outFile);
    end
end
