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
    <div className="absolute inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center" role="dialog" aria-modal="true">
      <article className="gamebar w-full max-w-md mx-4 animate-scale-in">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-prism flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <h2 className="display-xl" style={{ fontSize: 'clamp(18px, 4vw, 24px)' }}>{step.title}</h2>
          </div>
          <Button variant="ghost" size="icon" aria-label="Skip tutorial" onClick={onSkip} className="pill">
            <X className="w-4 h-4" />
          </Button>
        </header>

        <section className="mb-6">
          <p className="text-muted-foreground leading-relaxed meta">{step.content}</p>
          
          {/* Progress indicator */}
          <div className="flex gap-2 mt-4">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'bg-gradient-prism w-8'
                    : index < currentStep
                    ? 'bg-prism-b/60 w-6'
                    : 'bg-muted w-4'
                }`}
              />
            ))}
          </div>
        </section>

        <footer className="flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2 pill"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          
          <span className="text-sm text-muted-foreground meta">
            {currentStep + 1} of {tutorialSteps.length}
          </span>
          
          <Button
            onClick={nextStep}
            className="flex items-center gap-2 pill pill--hot"
          >
            {currentStep === tutorialSteps.length - 1 ? 'Start Playing!' : 'Next'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </footer>
      </article>
    </div>
  );
};