function outperm = clusterLymphSim(link, k, cut, filename, dataFile, outFile)
% This fucntion performs hierarchical clustering over the lymph node  
% similarity matrix and computes the chi^2 of the clusters given the
% different toxicity
% Input: link = linkage for clustering {'single', 'average', 'compelte', 'weighted'}  
%        k = number of clusters
%        filename = name of the csv file for the lymph node similarity matrix
%        dataFile = xlsx file with the data and scores
%        outFile = path/prefix for the output file
% Output: outperm = The leaf order of the patients in the dendrogram

idRange = 'A1:A592';    %The column with the patients id (for output)
rows = 591;             %The number of patients
%Outcome labels and their corresponding columns in the dataFile 
outcomeLbl = {'Aspiration_rate_Pre-therapy','Aspiration_rate_Post-therapy','Aspiration_rate','Neck_Disssection_after_IMRT','Feeding_tube_6m','Neck_boost'};
outcomeCols = {'Z','J','AL','AF','T','AO'};

%Format of the output file name
formatSpec = '%s_link=%s_k=%d.xlsx';
outputFile = sprintf(formatSpec, outFile, link, k); %Output file name
filename

simMatrix =importdata(filename);    %read the similarity matrix
SimilarityMatrix = simMatrix.data(:,1:rows);
distanceMatrix = 1-abs(SimilarityMatrix);
Y=distanceMatrix;                   %make it a distance matrix 

Z = linkage (Y, link);              %hierarchical clustering
I = inconsistent(Z);                
D = pdist(Y);

idx = find(Z(:,3)>0);       
clust = cluster(Z,'maxclust',idx(end)-idx(1));  %Clust is a clustering where all the patients are almost identical (many clusters)
clust2 = cluster(Z,'maxclust',k);   %Clus2 have the cluster assignments for k clusters

features = genDataSheet(dataFile, outcomeLbl, outcomeCols, rows);   %This function reads from the dataFile all the outcomes and encode it as 0-N, 1-Y, 2-U
patientIds = xlsread(dataFile,idRange); %Get the patient ids to include in the output
lbl = outcomeLbl;
% https://stackoverflow.com/questions/34948500/how-to-change-the-cluster-colours-in-a-dendrogram
leafOrder = optimalleaforder(Z,D);
% [H,T,outperm] = dendrogram(Z);    %Generate the dendrogram
% figure('units','normalized','outerposition',[0 0 1 1])

% [H,T,outperm] =dendrogram(Z,'Reorder',leafOrder,'ColorThreshold',cut);    %Generate the dendrogram
[H,T,outperm] =dendrogram(Z,'Reorder',leafOrder); 
title([string(link)])
% set(gca,'XTick',[]);

% Changing the colours
lineColors = cell2mat(get(H,'Color'));
colorList = unique(lineColors, 'rows');

myColors = [ 102,194,165;
             252,141,98;
             141,160,203;
             231,138,195;
             166,216,84;
             229,196,148;
             255,217,47;
             229,196,148;
             179,179,179
             ]/255;

for color = 2:size(colorList,1)
    %// Find which lines match this colour
    idx = ismember(lineColors, colorList(color,:), 'rows');
    %// Replace the colour for those lines
    lineColors(idx, :) = repmat(myColors(color-1,:),sum(idx),1);
end
   
%// Apply the new colours to the chart's line objects (line by line)
for line = 1:size(H,1)
    set(H(line), 'Color', lineColors(line,:));
end

%%Write the cluster assignments
xlswrite(outputFile,{'patientId'},'clusters','A1');
xlswrite(outputFile,patientIds,'clusters','A2');
xlswrite(outputFile,{'clusterId'},'clusters','B1');
xlswrite(outputFile,clust,'clusters','B2');
xlswrite(outputFile,{'dendogramId'},'clusters','C1');
xlswrite(outputFile,T,'clusters','C2');

xlswrite(outputFile,{'group'},'clusters','D1');
xlswrite(outputFile,clust2,'clusters','D2');

%Compute the chi^2 and generate one spreadsheet per outcome
x1=clust2;
n=max(clust2);
myvector=[1:n].';
current_row = 1;
current_sheet = 'All Results';
for i=1:size(lbl,2)
    sheet = cell2mat(lbl(1,i));
    x2 = features(:,i);
    [table,chi2,p] = crosstab(x1,x2);
    totals = {sum(table(:,1)),sum(table(:,2))};
    totals;
    
%     p
%     xlswrite(outputFile,{sheet},current_sheet,'A'+string(current_row));
    xlswrite(outputFile,{sheet},current_sheet,'A'+string(current_row));
    xlswrite(outputFile,myvector,current_sheet,'A'+string(current_row+1));

    xlswrite(outputFile,{'N', 'Y', 'U'},current_sheet,'B'+string(current_row));
    xlswrite(outputFile,table,current_sheet,'B'+string(current_row+1));
    xlswrite(outputFile,totals,current_sheet,'B'+string(current_row+1+n));

    xlswrite(outputFile,{'Chi^2'},current_sheet,'F'+string(current_row));
    xlswrite(outputFile,chi2,current_sheet,'G'+string(current_row));
    xlswrite(outputFile,{'p-value'},current_sheet,'F'+string(current_row+1));
    xlswrite(outputFile,p,current_sheet,'G'+string(current_row+1));
    
    current_row = current_row + n + 4;
end

%Local function to generate the outcome formatted for evaluation
function outcomes = genDataSheet(dataFile, outcomeLbl, outcomeCols, rows)           
    outcomes = zeros(rows,size(outcomeLbl,2));    
    for (i=1:size(outcomeLbl,2))        
        xlr = strcat(outcomeCols{1,i},'2:',outcomeCols{1,i},int2str(rows+1));
        [~,~,outcome] = xlsread(dataFile, xlr);
        for (j=1:rows)
            if (outcome{j,1}=='Y')
                outcomes(j,i)=1;            
            elseif (outcome{j,1}=='N')
                outcomes(j,i)=0;                    
            else
                outcomes(j,i)=2;
            end
        end    
    end