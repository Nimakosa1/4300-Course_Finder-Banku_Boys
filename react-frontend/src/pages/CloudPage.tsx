import OrganizedTagCloud from "@/components/WordCloud"

function CloudPage() {
  const handleLoadComplete = () => {
    console.log("Cloud animation completed");
  };

  return (
    <div style={{ 
      width: "100%", 
      height: "100vh", 
    }}>
      <OrganizedTagCloud onLoadComplete={handleLoadComplete} />
    </div>
  );
}

export default CloudPage;