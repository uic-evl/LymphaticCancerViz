(function(){
    queue()
        .defer(d3.csv, "data/csv/clusterLinkages.csv")
        .defer(d3.csv, "data/csv/patient_Groups_Ordering.csv")
        .await(function (error, linkage, groups) {
            if (error) {
                return console.warn(error);
            }

            /* Extract the clusters and distance from the Z output*/
            let c1 = _.map(_.map(linkage, 'Cluster 1'), _.toInteger),
                c2 = _.map(_.map(linkage, 'Cluster 2'), _.toInteger),
                cluster_id = _.map(_.map(linkage, 'Cluster ID'), _.toInteger),
                distance = _.map(_.map(linkage, 'Distance'), _.toNumber);

            /* Extract the data ids, groups, and order */
            let pid = _.map(_.map(groups, 'Aids'), _.toInteger),
                group = _.map(_.map(groups, 'Group'), _.toInteger),
                order = _.map(_.map(groups, 'Order'), _.toInteger);


        });
})();