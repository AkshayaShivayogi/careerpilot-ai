import { buildTechConcepts, builders } from "./topicBuilder.js";

const T = "DSA";

export const dsaConceptsExpanded = buildTechConcepts(T, [
  {
    name: "arrays and two pointers",
    beginner: "Two pointers scan sorted array for pair sum in O(n).",
    intermediate: "Sliding window for subarray with constraint.",
    advanced: "Dutch national flag partition for 3-way sort.",
    coding: builders.coding(T, "Find max sum subarray of size k.", "Sliding window accumulate add/remove ends.", "Fixed window template.", "O(n)", "O(1)"),
  },
  {
    name: "hash maps and frequency",
    beginner: "Hash map counts frequencies in O(n).",
    intermediate: "Anagram detection via char count map.",
    advanced: "Subarray sum equals K using prefix sum + map.",
    mcq: builders.mcq(T, "hash", "Two-sum unsorted array best average time?", ["O(n^2)", "O(n) with map", "O(log n)"], "O(n) with map", "Trade space for time."),
  },
  {
    name: "linked lists",
    beginner: "Reverse list iteratively with prev/curr/next.",
    intermediate: "Detect cycle with Floyd slow/fast pointers.",
    advanced: "Merge K sorted lists with min-heap.",
    coding: builders.coding(T, "Remove nth node from end in one pass.", "Two pointers n apart; delete after.", "Dummy head simplifies.", "O(n)", "O(1)"),
  },
  {
    name: "stacks and queues",
    beginner: "Valid parentheses with stack.",
    intermediate: "Monotonic stack for next greater element.",
    advanced: "Deque for sliding window maximum.",
    scenario: builders.scenario(T, "stack", "Evaluate arithmetic expression with precedence.", "Shunting-yard or two stacks.", "Classic interview."),
  },
  {
    name: "binary trees",
    beginner: "DFS preorder/inorder/postorder; BFS level order.",
    intermediate: "Validate BST with min/max bounds.",
    advanced: "Serialize tree with null markers.",
    coding: builders.coding(T, "Lowest common ancestor in binary tree.", "Recurse; if p/q found return node up.", "Divide and conquer.", "O(n)", "O(h)"),
  },
  {
    name: "graphs BFS DFS",
    beginner: "Adjacency list; BFS shortest unweighted path.",
    intermediate: "DFS for connected components / islands.",
    advanced: "Topological sort for course schedule.",
    scenario: builders.scenario(T, "graph", "Word ladder transform begin→end.", "BFS on implicit graph of words.", "Edge if one letter differs."),
  },
  {
    name: "dynamic programming",
    beginner: "Overlapping subproblems + optimal substructure.",
    intermediate: "1D DP fib/climbing stairs; 2D grid paths.",
    advanced: "State compression for DP on subsets.",
    coding: builders.coding(T, "Coin change minimum coins — recurrence?", "dp[amt]=min(dp[amt-c]+1); initialize INF.", "Bottom-up.", "O(n*amount)", "O(amount)"),
  },
  {
    name: "greedy algorithms",
    beginner: "Local optimal choices; prove greedy choice property.",
    intermediate: "Interval scheduling by end time.",
    advanced: "Huffman coding intuition.",
    mcq: builders.mcq(T, "greedy", "Activity selection sorts by?", ["Start time", "End time", "Duration"], "End time", "Maximizes remaining schedule."),
  },
  {
    name: "binary search",
    beginner: "Search sorted array O(log n).",
    intermediate: "Binary search on answer for monotonic predicate.",
    advanced: "Lower_bound / upper_bound variants.",
    coding: builders.coding(T, "Find first bad version — approach.", "Binary search on [1,n] versions; minimize API calls.", "O(log n) probes.", "O(1)", "O(1)"),
  },
  {
    name: "heaps and priority queues",
    beginner: "Min-heap gives smallest in O(log n) insert/extract.",
    intermediate: "Top K frequent elements with heap size K.",
    advanced: "Median from data stream with two heaps.",
    why: "FAANG frequency.",
  },
  {
    name: "recursion and backtracking",
    beginner: "Base case + recursive case; watch stack depth.",
    intermediate: "Subsets/permutations backtracking with choose/explore/unchoose.",
    advanced: "Prune invalid branches early.",
    coding: builders.coding(T, "Generate all permutations of array.", "Swap/index marking backtracking.", "O(n*n!).", "O(n)", "O(n)"),
  },
  {
    name: "complexity analysis",
    beginner: "Big-O worst case; space auxiliary vs total.",
    intermediate: "Amortized analysis for dynamic array push.",
    advanced: "Master theorem for divide-conquer recurrences.",
    bestPractice: { question: "How to communicate complexity in interviews?", answer: "State brute force, then optimized approach with n,m variables.", explanation: "Show trade-offs." },
  },
]);

// Keep export name expected by registry
export const dsaConcepts = dsaConceptsExpanded;
