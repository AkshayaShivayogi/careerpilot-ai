/** DSA concept explanations for analytics assistant */

export const DSA_CONCEPT_CONTENT = {
  arrays: {
    summary: "Contiguous memory storing elements with O(1) index access.",
    tips: "Master prefix sums, two pointers, and in-place swaps.",
    companies: ["Google", "Amazon", "Meta"],
  },
  strings: {
    summary: "Character sequences — immutability matters in Java/Python.",
    tips: "Know sliding window, palindrome checks, and anagram maps.",
    companies: ["Microsoft", "Apple", "Stripe"],
  },
  hashing: {
    summary: "Map keys to values for O(1) average lookups.",
    tips: "Use for frequency counts, complements, and deduplication.",
    companies: ["Amazon", "Uber", "Netflix"],
  },
  "linked list": {
    summary: "Nodes chained by pointers — O(1) insert at head.",
    tips: "Dummy nodes simplify edge cases; fast/slow pointers for cycles.",
    companies: ["Microsoft", "Oracle", "Adobe"],
  },
  stack: {
    summary: "LIFO structure for parsing, DFS, and monotonic patterns.",
    tips: "Valid parentheses, next greater element, histogram problems.",
    companies: ["Google", "Bloomberg", "Goldman Sachs"],
  },
  queue: {
    summary: "FIFO structure; BFS backbone.",
    tips: "Deque for sliding window max; circular queues in OS design.",
    companies: ["Meta", "Amazon", "LinkedIn"],
  },
  trees: {
    summary: "Hierarchical nodes — traverse in-order, pre-order, post-order.",
    tips: "Recursion + iterative stack; height, diameter, LCA patterns.",
    companies: ["Google", "Apple", "Airbnb"],
  },
  bst: {
    summary: "Ordered binary tree — O(log n) search when balanced.",
    tips: "Validate BST with range bounds; in-order successor.",
    companies: ["Amazon", "Microsoft", "Salesforce"],
  },
  heap: {
    summary: "Priority queue — min/max top in O(log n).",
    tips: "Top-K problems, merge K lists, median from data stream.",
    companies: ["Google", "Uber", "Twitter"],
  },
  graphs: {
    summary: "Nodes and edges — model networks, dependencies, maps.",
    tips: "BFS shortest unweighted; DFS connectivity; Dijkstra weighted.",
    companies: ["Meta", "Google", "Snap"],
  },
  recursion: {
    summary: "Functions calling themselves with base cases.",
    tips: "Draw recursion tree; convert to iteration when stack depth risks.",
    companies: ["All FAANG", "Startups"],
  },
  backtracking: {
    summary: "Explore choices, undo on failure (subsets, permutations, N-Queens).",
    tips: "Prune early; use visited sets and sorted input for duplicates.",
    companies: ["Google", "Amazon", "ByteDance"],
  },
  greedy: {
    summary: "Local optimal choices — prove greedy choice property.",
    tips: "Intervals scheduling, Huffman intuition, activity selection.",
    companies: ["Amazon", "Google", "Goldman Sachs"],
  },
  dp: {
    summary: "Optimal substructure + overlapping subproblems.",
    tips: "Top-down memo vs bottom-up tabulation; state definition is key.",
    companies: ["Google", "Meta", "Microsoft"],
  },
  "sliding window": {
    summary: "Maintain window over array/string for contiguous subarray problems.",
    tips: "Expand right, shrink left when constraint violated.",
    companies: ["Amazon", "Meta", "Apple"],
  },
  "two pointer": {
    summary: "Two indices moving toward each other or same direction.",
    tips: "Sorted array pairs, palindrome, container with most water.",
    companies: ["Stripe", "Google", "LinkedIn"],
  },
  "bit manipulation": {
    summary: "XOR tricks, masks, and bitwise DP.",
    tips: "n & (n-1) clears lowest set bit; count bits with Brian Kernighan.",
    companies: ["Apple", "Qualcomm", "Nvidia"],
  },
  tries: {
    summary: "Prefix tree for autocomplete and word search.",
    tips: "Compress paths; combine with DFS for board problems.",
    companies: ["Google", "Amazon", "Dropbox"],
  },
  "segment trees": {
    summary: "Range query/update in O(log n).",
    tips: "Lazy propagation for range updates; know when Fenwick tree suffices.",
    companies: ["Google", "Codeforces heavy", "HFT firms"],
  },
};

export function getConceptExplanation(slug) {
  return DSA_CONCEPT_CONTENT[slug] || {
    summary: "Core DSA pattern for technical interviews.",
    tips: "Practice easy → medium → hard with spaced revision.",
    companies: ["Product companies", "Startups"],
  };
}
