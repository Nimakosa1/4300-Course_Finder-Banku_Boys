// app/api/courses/search/route.js
export async function POST(request) {
  try {
    const body = await request.json();
    const query = body.query;

    if (!query) {
      return new Response(JSON.stringify([]), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use the Flask backend URL from environment or default to 5001
    const flaskApiUrl = process.env.FLASK_API_URL || "http://localhost:5001";

    console.log("Querying Flask API:", `${flaskApiUrl}/get/courses`);
    console.log("Query:", query);

    try {
      const response = await fetch(`${flaskApiUrl}/get/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        console.error("Flask API error:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("Error text:", errorText);
        throw new Error(
          `Flask API returned ${response.status}: ${response.statusText}`
        );
      }

      // Parse response as text first for debugging
      const textResponse = await response.text();
      console.log("Raw API response:", textResponse.substring(0, 200) + "...");

      // Try to parse the text as JSON
      let data;
      try {
        data = JSON.parse(textResponse);
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        throw new Error(
          `Invalid JSON response: ${textResponse.substring(0, 100)}...`
        );
      }

      // Return the data
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      // Return a more useful error message
      return new Response(
        JSON.stringify({
          error: fetchError.message,
          message:
            "Error connecting to Flask API. Make sure your Flask server is running on port 5001.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("General error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
