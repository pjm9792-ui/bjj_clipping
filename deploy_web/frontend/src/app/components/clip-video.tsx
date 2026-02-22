import { useState } from "react";
import { Link } from "react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { Switch } from "./ui/switch";
import { Slider } from "./ui/slider";
import { Progress } from "./ui/progress";
import { ChevronDown, Upload, Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type ProcessingStage = "idle" | "fetching" | "transcribing" | "chunking" | "scoring" | "exporting" | "complete";

const stages = [
  { id: "fetching", label: "Fetching video" },
  { id: "transcribing", label: "Transcribing" },
  { id: "chunking", label: "Chunking" },
  { id: "scoring", label: "Scoring" },
  { id: "exporting", label: "Exporting" },
];

export function ClipVideo() {
  const [videoUrl, setVideoUrl] = useState("");
  const [clipMode, setClipMode] = useState("concepts-techniques");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [clipLength, setClipLength] = useState([2]);
  const [maxClips, setMaxClips] = useState("10");
  const [burnSubtitles, setBurnSubtitles] = useState(true);
  const [generateSummaries, setGenerateSummaries] = useState(true);
  const [currentStage, setCurrentStage] = useState<ProcessingStage>("idle");
  const [progress, setProgress] = useState(0);
  const [generatedClipsCount, setGeneratedClipsCount] = useState(0);

  const handleGenerate = () => {
    setCurrentStage("fetching");
    setProgress(0);
    
    // Simulate processing stages
    const stageSequence: ProcessingStage[] = ["fetching", "transcribing", "chunking", "scoring", "exporting"];
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      currentIndex++;
      if (currentIndex < stageSequence.length) {
        setCurrentStage(stageSequence[currentIndex]);
        setProgress((currentIndex / stageSequence.length) * 100);
      } else {
        setCurrentStage("complete");
        setProgress(100);
        setGeneratedClipsCount(Math.floor(Math.random() * 5) + 8);
        clearInterval(interval);
      }
    }, 1500);
  };

  const getCurrentStageIndex = () => {
    return stages.findIndex(s => s.id === currentStage);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Clip a Video</CardTitle>
            <CardDescription>
              Paste a link to a BJJ instructional and generate study-ready clips.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Video URL Input */}
            <div className="space-y-2">
              <Label htmlFor="video-url">Video URL</Label>
              <Input
                id="video-url"
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="h-11"
              />
            </div>

            {/* Clip Mode */}
            <div className="space-y-2">
              <Label htmlFor="clip-mode">Clip Mode</Label>
              <Select value={clipMode} onValueChange={setClipMode}>
                <SelectTrigger id="clip-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concepts-techniques">Concepts + Techniques</SelectItem>
                  <SelectItem value="techniques-only">Techniques Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Advanced Settings */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                Advanced Settings
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4 pt-4 border-t border-border">
                {/* Clip Length */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Clip Length Target</Label>
                    <span className="text-sm text-muted-foreground">{clipLength[0]} min</span>
                  </div>
                  <Slider
                    value={clipLength}
                    onValueChange={setClipLength}
                    min={1}
                    max={3}
                    step={0.5}
                    className="w-full"
                  />
                </div>

                {/* Max Clips */}
                <div className="space-y-2">
                  <Label htmlFor="max-clips">Max Clips to Export</Label>
                  <Input
                    id="max-clips"
                    type="number"
                    value={maxClips}
                    onChange={(e) => setMaxClips(e.target.value)}
                    min="1"
                    max="50"
                  />
                </div>

                {/* Toggles */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="burn-subtitles" className="cursor-pointer">
                      Burn Subtitles
                    </Label>
                    <Switch
                      id="burn-subtitles"
                      checked={burnSubtitles}
                      onCheckedChange={setBurnSubtitles}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="generate-summaries" className="cursor-pointer">
                      Generate Summaries
                    </Label>
                    <Switch
                      id="generate-summaries"
                      checked={generateSummaries}
                      onCheckedChange={setGenerateSummaries}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleGenerate}
                disabled={!videoUrl || currentStage !== "idle" && currentStage !== "complete"}
                className="flex-1 bg-[var(--electric-blue)] text-white hover:bg-[var(--electric-blue)]/90 h-11"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Clips
              </Button>
              <Button variant="outline" className="h-11">
                <Upload className="w-4 h-4 mr-2" />
                Local File
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Processing Section */}
        <AnimatePresence>
          {currentStage !== "idle" && (
            <motion.div
              initial={{ opacity: 0, y: 20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6"
            >
              <Card className="shadow-xl">
                <CardContent className="pt-6 space-y-6">
                  {currentStage !== "complete" ? (
                    <>
                      {/* Overall Progress */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Processing...</span>
                          <span className="text-muted-foreground">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      {/* Stage Stepper */}
                      <div className="space-y-3">
                        {stages.map((stage, index) => {
                          const isActive = stage.id === currentStage;
                          const isComplete = getCurrentStageIndex() > index;
                          
                          return (
                            <div key={stage.id} className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                                isComplete 
                                  ? 'bg-[var(--electric-blue)] text-white'
                                  : isActive
                                  ? 'bg-[var(--electric-blue)]/20 border-2 border-[var(--electric-blue)]'
                                  : 'bg-muted border-2 border-border'
                              }`}>
                                {isComplete ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : isActive ? (
                                  <Loader2 className="w-3 h-3 animate-spin text-[var(--electric-blue)]" />
                                ) : (
                                  <span className="text-xs text-muted-foreground">{index + 1}</span>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className={`text-sm transition-colors ${
                                  isActive ? 'text-foreground' : isComplete ? 'text-muted-foreground' : 'text-muted-foreground/60'
                                }`}>
                                  {stage.label}
                                </div>
                                {isActive && (
                                  <div className="text-xs text-[var(--electric-blue)] mt-0.5">
                                    Processing...
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    /* Success State */
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-6 space-y-4"
                    >
                      <div className="w-16 h-16 rounded-full bg-[var(--electric-blue)]/10 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-10 h-10 text-[var(--electric-blue)]" />
                      </div>
                      <div>
                        <h3 className="text-xl mb-2">Clips Generated Successfully!</h3>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p><span className="text-foreground">{generatedClipsCount}</span> clips generated</p>
                          <p>Total duration: <span className="text-foreground">{Math.floor(generatedClipsCount * 2.1)} min</span></p>
                          <p>Processing time: <span className="text-foreground">12 seconds</span></p>
                        </div>
                      </div>
                      <div className="flex gap-3 justify-center pt-2">
                        <Link to="/library">
                          <Button className="bg-[var(--electric-blue)] text-white hover:bg-[var(--electric-blue)]/90">
                            View in Library
                          </Button>
                        </Link>
                        <Button variant="outline">
                          Open Output Folder
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
