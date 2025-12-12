"use client";

import { useState } from "react";

export default function WizardPage() {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = () => {
    alert(`Tease saved!\nTitle: ${title}\nDescription: ${description}`);
    // later: call your API route to save in DB
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center text-black dark:text-white">
          Tease Wizard
        </h1>

        {/* Step Content */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <label className="text-black dark:text-white">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border p-2 rounded"
              placeholder="Enter tease title"
            />
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <label className="text-black dark:text-white">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border p-2 rounded"
              placeholder="Enter tease description"
            />
          </div>
        )}

        {step === 3 && (
          <div className="text-center">
            <h2 className="text-lg text-black dark:text-white mb-4">Review</h2>
            <p className="text-black dark:text-white"><strong>Title:</strong> {title}</p>
            <p className="text-black dark:text-white"><strong>Description:</strong> {description}</p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          {step > 1 ? (
            <button
              onClick={prevStep}
              className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600"
            >
              Previous
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              onClick={nextStep}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
            >
              Submit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
