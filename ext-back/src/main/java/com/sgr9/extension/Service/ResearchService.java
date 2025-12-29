package com.sgr9.extension.Service;

import com.sgr9.extension.Repository.GeminiResponse;
import com.sgr9.extension.Repository.ResearchRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;

@Service
public class ResearchService {
    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public ResearchService(WebClient.Builder webClientBuilder, ObjectMapper objectMapper) {
        this.webClient = webClientBuilder.build();
        this.objectMapper = objectMapper;
    }


    public String processContent(ResearchRequest request) {
        // Building prompt
        String prompt = buildPrompt(request);

        // Querying AI Model API
        Map<String, Object> requestBody = Map.of(
                "contents", new Object[] {
                        Map.of("parts", new Object[]{
                                Map.of("text", prompt)
                        })
                }
        );

        String response = webClient.post()
                .uri(geminiApiUrl + geminiApiKey) // Concatenate directly
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        // Parse the response
        // Return response

        return extractTextFromResponse(response);
    }

    private String extractTextFromResponse(String response) {
        try {
            GeminiResponse geminiResponse = objectMapper.readValue(response, GeminiResponse.class);
            if (geminiResponse.getCandidates() != null && !geminiResponse.getCandidates().isEmpty()) {
                GeminiResponse.Candidate firstCandidate = geminiResponse.getCandidates().get(0);
                if (firstCandidate.getContent() != null &&
                        firstCandidate.getContent().getParts() != null &&
                        !firstCandidate.getContent().getParts().isEmpty()) {
                    return firstCandidate.getContent().getParts().get(0).getText();
                }
            }
            return "No content found in response";
        } catch (Exception e) {
            return "Error Parsing: " + e.getMessage();
        }
    }

    private String buildPrompt(ResearchRequest request) {
        StringBuilder prompt = new StringBuilder();
        switch (request.getOperation()) {
            case "summarize":
                prompt.append("Provide a clear and concise summary of the following text in a few sentences, Format the response using clear Markdown, with double newlines between sections and bullet points for lists:\n\n");
                break;
            case "explain":
                prompt.append("Explain the following concept in a general, intuitive way using a simple analogy and real-world examples, Format the response using clear Markdown, with double newlines between sections and bullet points for lists:\n\n");
                break;
            case "suggest":
                prompt.append("Based on the following content: suggest related topics and further reading. Format the response with clear headings and bullet points, Format the response using clear Markdown, with double newlines between sections and bullet points for lists:\n\n");
                break;
            case "extract":
                prompt.append("Scan the following text for all numerical data, statistics, and financial figures. Organize these findings into a clear, markdown-formatted table with descriptions for each value, Format the response using clear Markdown, with double newlines between sections and bullet points for lists:\n\n");
                break;
            case"mapper":
                prompt.append("Analyze the following text and identify the core technical concepts. For each concept, provide a one-sentence definition and list 2-3 'Prerequisite Topics' I should understand first, Format the response using clear Markdown, with double newlines between sections and bullet points for lists:\n\n");
                break;
            case"factcheck":
                prompt.append("Extract all the factual claims from the following text and list them as bullet points. For each claim, indicate if it is a commonly accepted fact or if it requires further verification from external sources, Format the response using clear Markdown, with double newlines between sections and bullet points for lists:\n\n");
                break;
            default:
                throw new IllegalArgumentException("Unknown Operation: " + request.getOperation());
        }
        prompt.append(request.getContent());
        return prompt.toString();
    }
}