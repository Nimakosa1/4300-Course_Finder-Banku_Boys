"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DirectSearch from "@/components/DirectSearch";

export default function DebugPage() {
  const [flaskStatus, setFlaskStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkFlaskConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/debug/flask");
      const data = await response.json();
      setFlaskStatus(data);
    } catch (error) {
      setFlaskStatus({
        ok: false,
        error: error.message,
        message: "Error checking Flask connection",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkFlaskConnection();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Debug Page</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Flask Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Checking connection...</p>
          ) : flaskStatus ? (
            <div>
              <div
                className={`p-4 rounded mb-4 ${
                  flaskStatus.ok
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                <strong>Status: </strong>
                {flaskStatus.ok ? "Connected ✅" : "Error ❌"}
              </div>

              <div className="mb-4">
                <strong>Message: </strong> {flaskStatus.message}
              </div>

              {flaskStatus.error && (
                <div className="mb-4">
                  <strong>Error: </strong> {flaskStatus.error}
                </div>
              )}

              {flaskStatus.data && (
                <div className="mb-4">
                  <strong>Response Data: </strong>
                  <pre className="bg-gray-100 p-2 rounded">
                    {JSON.stringify(flaskStatus.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <p>No connection data available</p>
          )}

          <Button
            onClick={checkFlaskConnection}
            disabled={loading}
            className="mt-4"
          >
            {loading ? "Checking..." : "Check Connection Again"}
          </Button>
        </CardContent>
      </Card>

      <DirectSearch />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Troubleshooting Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">1. Check Flask Server</h3>
            <p>
              Make sure your Flask server is running on port 5001. You should
              see output in your terminal confirming it&apos;s running.
            </p>
            <pre className="bg-gray-100 p-3 rounded mt-2 text-sm">
              python app.py
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">
              2. Verify CORS Configuration
            </h3>
            <p>Make sure your Flask app has CORS properly configured:</p>
            <pre className="bg-gray-100 p-3 rounded mt-2 text-sm">
              {`from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)`}
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">
              3. Check Flask Error Logs
            </h3>
            <p>
              Look for error messages in your Flask server console output when
              you make a request.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">4. Test with curl</h3>
            <p>Test your Flask API directly with curl:</p>
            <pre className="bg-gray-100 p-3 rounded mt-2 text-sm">
              {`curl -X POST -H "Content-Type: application/json" -d '{"query":"computer"}' http://localhost:5001/get/courses`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
