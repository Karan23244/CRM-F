import { useState } from "react";
import axios from "axios";
import { Card, Input, Button, Tag, Alert } from "antd";
import { SearchOutlined } from "@ant-design/icons";

const apiUrl = import.meta.env.VITE_API_URL;

export default function PublisherStatusSearch() {
  const [publisher, setPublisher] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const searchPublisher = async () => {
    if (!publisher.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const { data } = await axios.get(
        `${apiUrl}/getpubstatusnew`,
        {
          params: {
            publisher,
          },
        },
      );

      setResult(data);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <Card
      title="Publisher Status Checker"
      className="max-w-xl mx-auto mt-10 shadow-lg">
      <div className="flex gap-3">
        <Input
          size="large"
          placeholder="Enter Publisher Name"
          value={publisher}
          onChange={(e) => setPublisher(e.target.value)}
          onPressEnter={searchPublisher}
          prefix={<SearchOutlined />}
        />

        <Button
          type="primary"
          loading={loading}
          onClick={searchPublisher}
          size="large">
          Search
        </Button>
      </div>

      {result && (
        <div className="mt-6">
          {result.found ? (
            <Alert
              type="success"
              showIcon
              message="Publisher Found"
              description={
                <div className="space-y-2">
                  <p>
                    <strong>Publisher:</strong> {result.data.pub_name}
                  </p>

                  <p>
                    <strong>Publisher ID:</strong> {result.data.pub_id}
                  </p>

                  <p>
                    <strong>PUB AM:</strong> {result.data.username}
                  </p>

                  <p>
                    <strong>Status:</strong>{" "}
                    <Tag color={result.data.pause === "1" ? "red" : "green"}>
                      {result.data.status}
                    </Tag>
                  </p>
                </div>
              }
            />
          ) : (
            <Alert
              type="error"
              showIcon
              message="Publisher Not Found"
              description="No publisher exists with the entered name."
            />
          )}
        </div>
      )}
    </Card>
  );
}
