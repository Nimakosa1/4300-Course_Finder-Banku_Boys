export async function POST(req) {
  try {
    // Get the Flask API URL from environment variables
    const flaskApiUrl =
      process.env.NEXT_PUBLIC_FLASK_API_URL || "http://localhost:5001";

    // Get the request body
    const body = await req.json();

    console.log(
      `Proxying request to Flask API: ${flaskApiUrl}/api/courses/search`
    );
    console.log(`Query: ${body.query}`);

    // Forward the request to the Flask API
    const response = await fetch(`${flaskApiUrl}/api/courses/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Handle errors
    if (!response.ok) {
      console.error(`Flask API responded with status: ${response.status}`);
      return new Response(
        JSON.stringify({
          error: `Flask API error: ${response.status}`,
          message:
            "Error connecting to Flask API. Make sure your Flask server is running on port 5001.",
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return the response from the Flask API
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(
      JSON.stringify({
        error: `Failed to proxy request: ${error.message}`,
        message:
          "Error connecting to Flask API. Make sure your Flask server is running on port 5001.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
