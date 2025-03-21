// app/api/debug/flask/route.js
export async function GET(request) {
  try {
    // Use the Flask backend URL from environment or default to 5001
    const flaskApiUrl = process.env.FLASK_API_URL || "http://localhost:5001";

    console.log("Checking Flask connection:", `${flaskApiUrl}`);

    // Add a simple test endpoint to your Flask app
    // @app.route("/test", methods=["GET"])
    // def test():
    //     return jsonify({"status": "ok", "message": "Flask server is running"})

    try {
      const response = await fetch(`${flaskApiUrl}/test`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const errorText = await response.text();
        return new Response(
          JSON.stringify({
            ok: false,
            status: response.status,
            statusText: response.statusText,
            error: errorText,
            message: "Failed to connect to Flask server",
          }),
          {
            status: 200, // We return 200 so the client gets our diagnostics
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Parse response
      const data = await response.json();
      return new Response(
        JSON.stringify({
          ok: true,
          status: response.status,
          statusText: response.statusText,
          data,
          message: "Successfully connected to Flask server",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (fetchError) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: fetchError.message,
          message:
            "Error connecting to Flask API. Make sure your Flask server is running on port 5001.",
        }),
        {
          status: 200, // We return 200 so the client gets our diagnostics
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: error.message,
        message: "Internal server error",
      }),
      {
        status: 200, // We return 200 so the client gets our diagnostics
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
