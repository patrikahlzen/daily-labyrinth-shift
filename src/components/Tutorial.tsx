import React, { useState } from 'react';
import { Button } from './ui/button';
import { ArrowRight, ArrowLeft, X, Hand, MousePointer, Zap } from 'lucide-react';

interface TutorialProps {
  onComplete: () => void;
  onSkip: () => void;
}

const tutorialSteps = [
  {
    title: "Welcome to Daily Labyrinth!",
    content: "Ett nytt pussel varje dag! Koppla ihop den blå startrutan med den gyllene målrutan genom att skapa den mest effektiva vägen möjligt.",
    icon: <Zap className="w-8 h-8 text-primary" />,
    highlight: "goal"
  },
  {
    title: "Hur man spelar",
    content: "Byt plats på rutor genom att trycka på två rutor. Bygg sammanhängande rörförbindelser för att skapa en komplett väg från start till mål.",
    icon: <Hand className="w-8 h-8 text-primary" />,
    highlight: "swap"
  },
  {
    title: "Samla ädelstenar & var effektiv",
    content: "Samla ädelstenar längs din väg för bonuspoäng. Ju färre drag du använder, desto bättre blir din poäng!",
    icon: <MousePointer className="w-8 h-8 text-primary" />,
    highlight: "gems"
  },
  {
    title: "Tjäna stjärnor!",
    content: "Slutför pussel för att tjäna 1-3 stjärnor baserat på din prestation. Du har 3 undo-drag per dag att använda strategiskt!",
    icon: <Zap className="w-8 h-8 text-primary" />,
    highlight: "rating"
  }
];

export const Tutorial: React.FC<TutorialProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = tutorialSteps[currentStep];

  return (
    <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <article className="gamebar w-full max-w-lg mx-auto animate-scale-in">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-prism flex items-center justify-center shadow-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="display-xl">{step.title}</h2>
              <div className="flex gap-1 mt-1">
                {tutorialSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === currentStep
                        ? 'bg-gradient-prism w-6'
                        : index < currentStep
                        ? 'bg-prism-b/60 w-4'
                        : 'bg-muted w-3'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" aria-label="Skip tutorial" onClick={onSkip} className="pill">
            <X className="w-4 h-4" />
          </Button>
        </header>

        <section className="mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              {step.icon}
            </div>
            <div className="flex-1 space-y-4">
              <p className="text-foreground leading-relaxed text-base">{step.content}</p>
            </div>
          </div>
        </section>

        <footer className="flex justify-between items-center gap-4">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2 pill min-w-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="hidden sm:inline">Step</span>
            <span className="font-medium">{currentStep + 1}</span>
            <span>of</span>
            <span className="font-medium">{tutorialSteps.length}</span>
          </div>
          
          <Button
            onClick={nextStep}
            className="flex items-center gap-2 pill pill--hot min-w-0"
          >
            <span className="hidden sm:inline">
              {currentStep === tutorialSteps.length - 1 ? 'Start Playing!' : 'Next'}
            </span>
            <span className="sm:hidden">
              {currentStep === tutorialSteps.length - 1 ? 'Start!' : 'Next'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </footer>
      </article>
    </div>
  );
};