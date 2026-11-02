# Document Summarization Evaluation & Quality Report
**Project:** AI Workspace (Workflow AI)  
**Author:** Yash Raj (Member 4 - Class Roll No: 2360014)  
**Mentor:** Prof. Sajal Mitra  
**Week 5 Milestone:** Prepare document test set; evaluate summary relevance, clarity, and errors.  

---

## 1. Evaluation Methodology
Following the research methodologies of Awasthi et al. (2021) and Supriyono et al. (2024), the summarization engine was evaluated on an academic corpus consisting of technical seminar reports, cloud computing literature, and meeting minutes.

### Quality Dimensions Measured:
1. **ROUGE-1 F1:** Overlap of unigram informative content.
2. **ROUGE-2 F1:** Preservation of technical bigram phrasal structures.
3. **ROUGE-L F1:** Longest common subsequence preservation.
4. **Compression Ratio:** Summary length divided by source text length ($\frac{|S_{\text{summary}}|}{|S_{\text{source}}|}$).
5. **Factuality & Citation Grounding:** Ratio of factual assertions traceable directly to the source text without hallucination.

---

## 2. Experimental Results Summary

| Test Document | Domain / Type | Compression Ratio | ROUGE-1 F1 | ROUGE-2 F1 | ROUGE-L F1 | Factuality Rating |
|---|---|---|---|---|---|---|
| `cloud_scheduling_survey.txt` | Distributed Systems Literature | 35.4% | **0.5468** | **0.5109** | **0.5468** | **100%** |
| `seminar3_summary_test.txt` | Academic Project Report | 33.1% | **0.4840** | **0.4608** | **0.4840** | **100%** |
| **Aggregate Benchmark** | **Technical Corpus Average** | **34.25%** | **0.5154** | **0.4859** | **0.5154** | **100%** |

---

## 3. Findings on Clarity, Errors & Action Extraction
- **Zero Hallucination:** Because the primary engine uses an extractive TextRank approach, all extracted sentences are verbatim excerpts from verified user documents, eliminating hallucinated dates or invented tasks.
- **Action Item Precision:** The action item extraction regex cleanly identified imperative clauses (`must complete their module testing...`), allowing students to convert requirements into actionable tasks with a single click.
- **Clarity:** Summaries achieve an average compression ratio of $\sim 34\%$, reducing reading time by over $65\%$ while retaining critical architectural findings.
