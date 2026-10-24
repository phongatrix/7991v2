'use client';

import React, { useState, useEffect } from 'react';
import { Grade, ExamMatrix, ExamSpec, FullExamPackage, Question } from '@/lib/types';
import { CURRICULUM_DATA } from '@/lib/curriculumData';
import { autoDistributeMatrix, gradeDefaultTotals } from '@/lib/matrixDistributor';
import { generateSpec } from '@/lib/specGenerator';
import { buildExamPackage } from '@/lib/examGenerator';
import { Header } from '@/components/Header';
import { StepIndicator } from '@/components/StepIndicator';
import { Step1Select } from '@/components/Step1Select';
import { Step2Matrix } from '@/components/Step2Matrix';
import { Step3Spec } from '@/components/Step3Spec';
import { Step4Exam } from '@/components/Step4Exam';
import { Step5Answers } from '@/components/Step5Answers';
import { Step6Export } from '@/components/Step6Export';
import { QuestionBankModal } from '@/components/QuestionBankModal';
import { ImportWordModal } from '@/components/ImportWordModal';
import { ConfigModal } from '@/components/ConfigModal';
import { SwapQuestionModal } from '@/components/SwapQuestionModal';
import { QuestionEditorModal } from '@/components/QuestionEditorModal';

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [maxReachedStep, setMaxReachedStep] = useState(1);

  // Exam configuration
  const [grade, setGrade] = useState<Grade>('11');
  const [title, setTitle] = useState('ĐỀ KIỂM TRA ĐỊNH KỲ');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [department, setDepartment] = useState('SỞ GIÁO DỤC & ĐÀO TẠO ĐỒNG THÁP');
  const [school, setSchool] = useState('TRƯỜNG THPT TRƯƠNG ĐỊNH');
  const [variantCount, setVariantCount] = useState(4);

  // Selected lessons
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([
    'k11_b1', 'k11_b2', 'k11_b3', 'k11_b4', 'k11_b5'
  ]);

  // Questions cache
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);

  // Generated structures
  const [matrix, setMatrix] = useState<ExamMatrix | null>(null);
  const [spec, setSpec] = useState<ExamSpec | null>(null);
  const [examPackage, setExamPackage] = useState<FullExamPackage | null>(null);

  // Modals state
  const [isQBankOpen, setIsQBankOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Swap question state
  const [swapTarget, setSwapTarget] = useState<{ lessonId: string; lessonName: string } | null>(null);

  // Fetch initial questions
  const loadQuestions = async () => {
    try {
      const res = await fetch('/api/questions');
      const data = await res.json();
      setAvailableQuestions(data.questions || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  // Update selected lessons when grade changes
  useEffect(() => {
    if (grade === '11') {
      setSelectedLessonIds(['k11_b1', 'k11_b2', 'k11_b3', 'k11_b4', 'k11_b5']);
    } else if (grade === '10') {
      setSelectedLessonIds(['k10_b1', 'k10_b2', 'k10_b3', 'k10_b4', 'k10_b5']);
    } else if (grade === '12') {
      setSelectedLessonIds(['k12_b1', 'k12_b2', 'k12_b3', 'k12_b4', 'k12_b7']);
    }
  }, [grade]);

  const goToStep = (step: number) => {
    setCurrentStep(step);
    if (step > maxReachedStep) {
      setMaxReachedStep(step);
    }
  };

  // Reset all
  const handleReset = () => {
    if (confirm('Bạn có chắc muốn làm mới toàn bộ quy trình tạo đề?')) {
      setCurrentStep(1);
      setMaxReachedStep(1);
      setMatrix(null);
      setSpec(null);
      setExamPackage(null);
      setGrade('11');
      setSelectedLessonIds(['k11_b1', 'k11_b2', 'k11_b3', 'k11_b4', 'k11_b5']);
    }
  };

  // Fast load sample mau.pdf
  const handleLoadSampleMauPdf = () => {
    setGrade('11');
    setTitle('ĐỀ KIỂM TRA');
    setDurationMinutes(45);
    const k11Lessons = ['k11_b1', 'k11_b2', 'k11_b3', 'k11_b4', 'k11_b5'];
    setSelectedLessonIds(k11Lessons);

    const m = autoDistributeMatrix({
      grade: '11',
      subject: 'Tin học',
      title: 'ĐỀ KIỂM TRA',
      durationMinutes: 45,
      selectedLessonIds: k11Lessons,
      totalMCQ: 12,
      totalTF: 4,
      totalSA: 0,
      totalTL: 3,
      availableQuestions,
      useSampleLayout: true
    });
    setMatrix(m);

    const pkg = buildExamPackage({
      matrix: m,
      availableQuestions,
      department: 'SỞ GIÁO DỤC & ĐÀO TẠO ĐỒNG THÁP',
      school: 'TRƯỜNG THPT TRƯƠNG ĐỊNH',
      title: 'ĐỀ KIỂM TRA',
      variantCount: 4
    });
    setExamPackage(pkg);
    setSpec(pkg.spec);

    setMaxReachedStep(6);
    goToStep(6);
  };

  // Step 1 -> Step 2
  const handleStep1Next = () => {
    if (!matrix || matrix.grade !== grade) {
      const totals = gradeDefaultTotals(grade);
      const m = autoDistributeMatrix({
        grade,
        subject: 'Tin học',
        title: title || `ĐỀ KIỂM TRA MÔN TIN HỌC LỚP ${grade}`,
        durationMinutes,
        selectedLessonIds,
        ...totals,
        availableQuestions
      });
      setMatrix(m);
    }
    goToStep(2);
  };

  // Step 2 -> Step 3
  const handleStep2Next = () => {
    if (!matrix) return;
    const pkg = buildExamPackage({
      matrix,
      availableQuestions,
      department,
      school,
      title,
      variantCount
    });
    setExamPackage(pkg);
    setSpec(pkg.spec);
    goToStep(3);
  };

  // Step 3 -> Step 4
  const handleStep3Next = () => {
    if (!examPackage) {
      handleStep2Next();
    }
    goToStep(4);
  };

  // Step 4 -> Step 5
  const handleStep4Next = () => {
    goToStep(5);
  };

  // Step 5 -> Step 6
  const handleStep5Next = () => {
    goToStep(6);
  };

  // Reshuffle variants in step 4
  const handleReshuffle = () => {
    if (!matrix) return;
    const pkg = buildExamPackage({
      matrix,
      availableQuestions,
      department,
      school,
      title,
      variantCount
    });
    setExamPackage(pkg);
    setSpec(pkg.spec);
  };

  // Handle swapping question
  const handleSelectSwapQuestion = (newQ: Question) => {
    if (!matrix || !examPackage) return;
    // Replace in examPackage
    const updatedPool = [newQ, ...availableQuestions.filter(q => q.id !== newQ.id)];
    const pkg = buildExamPackage({
      matrix,
      availableQuestions: updatedPool,
      department,
      school,
      title,
      variantCount,
      chosenQuestionIds: [newQ.id, ...examPackage.selectedQuestionIds]
    });
    setExamPackage(pkg);
    setSpec(pkg.spec);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Navbar */}
      <Header
        onOpenQBank={() => setIsQBankOpen(true)}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenConfig={() => setIsConfigOpen(true)}
        onReset={handleReset}
      />

      {/* 6 Step Navigation Bar */}
      <StepIndicator
        currentStep={currentStep}
        onSelectStep={goToStep}
        maxReachedStep={maxReachedStep}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentStep === 1 && (
          <Step1Select
            grade={grade}
            setGrade={setGrade}
            title={title}
            setTitle={setTitle}
            durationMinutes={durationMinutes}
            setDurationMinutes={setDurationMinutes}
            department={department}
            setDepartment={setDepartment}
            school={school}
            setSchool={setSchool}
            variantCount={variantCount}
            setVariantCount={setVariantCount}
            onNext={handleStep1Next}
            onLoadSampleMauPdf={handleLoadSampleMauPdf}
          />
        )}

        {currentStep === 2 && (
          <Step2Matrix
            grade={grade}
            matrix={matrix}
            setMatrix={setMatrix}
            selectedLessonIds={selectedLessonIds}
            setSelectedLessonIds={setSelectedLessonIds}
            onNext={handleStep2Next}
            onBack={() => goToStep(1)}
          />
        )}

        {currentStep === 3 && matrix && spec && (
          <Step3Spec
            matrix={matrix}
            spec={spec}
            setSpec={setSpec}
            onNext={handleStep3Next}
            onBack={() => goToStep(2)}
            onOpenSwapModal={(lessonId, lessonName) => setSwapTarget({ lessonId, lessonName })}
          />
        )}

        {currentStep === 4 && examPackage && (
          <Step4Exam
            examPackage={examPackage}
            onNext={handleStep4Next}
            onBack={() => goToStep(3)}
            onReshuffle={handleReshuffle}
          />
        )}

        {currentStep === 5 && examPackage && (
          <Step5Answers
            examPackage={examPackage}
            onNext={handleStep5Next}
            onBack={() => goToStep(4)}
          />
        )}

        {currentStep === 6 && examPackage && (
          <Step6Export
            examPackage={examPackage}
            onBack={() => goToStep(5)}
            onReset={handleReset}
          />
        )}
      </main>

      {/* Modals */}
      <QuestionBankModal
        isOpen={isQBankOpen}
        onClose={() => setIsQBankOpen(false)}
        onAddNew={() => setIsEditorOpen(true)}
      />

      <ImportWordModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={() => {
          loadQuestions();
        }}
      />

      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />

      <QuestionEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSaved={() => {
          loadQuestions();
        }}
      />

      {swapTarget && (
        <SwapQuestionModal
          isOpen={Boolean(swapTarget)}
          onClose={() => setSwapTarget(null)}
          lessonId={swapTarget.lessonId}
          lessonName={swapTarget.lessonName}
          onSelectQuestion={handleSelectSwapQuestion}
        />
      )}
    </div>
  );
}
