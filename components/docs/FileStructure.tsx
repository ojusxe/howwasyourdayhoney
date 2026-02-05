import { CodeBlock } from "@/components/ui/code-block";

export default function FileStructure() {
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">file structure</h2>
      <p className="text-gray-700 mb-4">your downloaded ZIP file contains:</p>
      
      <div className="mb-6">
        <CodeBlock 
          language="bash"
          code={`ascii-frames-[jobId]-[timestamp].zip
├── frames/
│   ├── frame_0000.txt          # ASCII content for frame 0
│   ├── frame_0000_colors.json  # Color data (if applicable)
│   ├── frame_0001.txt          # ASCII content for frame 1
│   └── ...
├── metadata.json               # Conversion settings and info
├── ABOUT.txt                   # About the application
└── README.md                   # Complete usage guide`}
        />
      </div>

      <h3 className="text-xl font-semibold text-gray-900 mb-3">metadata format</h3>
      <p className="text-gray-700 mb-4">the metadata.json file contains:</p>
      
      <div className="mb-6">
        <CodeBlock 
          language="json"
          code={`{
  "totalFrames": 24,
  "generator": "How Was Your Day Honey?",
  "generatedAt": "2024-01-15T10:30:00.000Z",
  "format": "txt"
}`}
        />
      </div>
    </section>
  );
}
