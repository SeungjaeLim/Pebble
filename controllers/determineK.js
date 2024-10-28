import KMeans from "kmeans-js";
import cosineSimilarity from "cosine-similarity";

/**
 * Calculate the silhouette score to evaluate clustering quality.
 */
function silhouetteScore(embeddings, labels, k) {
  const n = embeddings.length;
  let totalScore = 0;

  for (let i = 0; i < n; i++) {
    const currentVector = embeddings[i];
    const currentCluster = labels[i];

    // Calculate 'a' - average similarity within the same cluster
    const sameCluster = embeddings.filter((_, idx) => labels[idx] === currentCluster);
    const a = sameCluster.length > 1 
      ? sameCluster.reduce((sum, vec) => sum + cosineSimilarity(currentVector, vec), 0) / (sameCluster.length - 1) 
      : 0;

    // Calculate 'b' - lowest average similarity to another cluster
    let b = Infinity;
    for (let j = 0; j < k; j++) {
      if (j === currentCluster) continue;
      const otherCluster = embeddings.filter((_, idx) => labels[idx] === j);
      if (otherCluster.length > 0) {
        const avgDist = otherCluster.reduce((sum, vec) => sum + cosineSimilarity(currentVector, vec), 0) / otherCluster.length;
        b = Math.min(b, avgDist);
      }
    }
    // Compute silhouette score for the current point
    const score = b > a ? (b - a) / b : (b - a) / a;
    totalScore += score;
  }

  return totalScore / n;
}

/**
 * Determine the optimal number of clusters (K) using silhouette score.
 */
function determineK(embeddings) {
  const kOptions = [2, 3, 4, 5];
  let bestK = kOptions[0];
  let bestScore = -Infinity;

  for (const k of kOptions) {
    const kmeans = new KMeans({
      k,
      maxIterations: 100,
      tolerance: 0.01,
      distanceFunction: (a, b) => 1 - cosineSimilarity(a, b),
    });

    const clusters = kmeans.cluster(embeddings);
    const labels = clusters.map((cluster) => cluster.clusterIdx);

    // Calculate silhouette score for the current K value
    const score = silhouetteScore(embeddings, labels, k);
    if (score > bestScore) {
      bestScore = score;
      bestK = k;
    }
  }

  console.log("Best K value:", bestK); // Use console.log instead of print
  return bestK;
}

export { determineK };
