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

  // Đang tự sinh câu hỏi bổ sung cho ma trận (AI)
  const [isEnsuringQuestions, setIsEnsuringQuestions] = useState(false);
  const [ensureLabel, setEnsureLabel] = useState('');

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

  // Đảm bảo ngân hàng đủ câu đúng dạng × mức × bài theo ma trận:
  // thiếu thì gọi server tự sinh bằng AI và lưu vào ngân hàng câu hỏi.
  // Serverless (Vercel) giới hạn thời gian mỗi request, nên client sinh theo
  // TỪNG ĐỢT NHỎ và lặp lại tới khi đủ số câu còn thiếu.
  const ensureQuestionsForMatrix = async (m: ExamMatrix): Promise<Question[]> => {
    setIsEnsuringQuestions(true);
    setEnsureLabel('Đang kiểm tra ngân hàng câu hỏi…');
    const allGenerated: Question[] = [];
    const generatedIds = new Set<string>();
    const allErrors: string[] = [];
    let platformFails = 0;
    let stallRounds = 0;
    let chunkSize = 5; // số câu mỗi request — tự hạ khi server bị ngắt giữa chừng
    let lastRemaining = 0;

    const mergeGeneratedIntoBank = () => {
      if (allGenerated.length === 0) return;
      setAvailableQuestions(prev => {
        const ids = new Set(prev.map(q => q.id));
        return [...allGenerated.filter(q => !ids.has(q.id)), ...prev];
      });
    };

    try {
      for (let round = 0; round < 60; round++) {
        const res = await fetch('/api/exam/ensure-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ matrix: m, maxGenerate: chunkSize, extraQuestions: allGenerated })
        });
        const text = await res.text();
        let data: any;
        try {
          data = JSON.parse(text);
        } catch {
          // Máy chủ trả trang lỗi của platform (function bị kill/quá tải) thay vì
          // JSON — hạ số câu mỗi đợt rồi thử lại, chỉ bỏ cuộc sau nhiều lần.
          platformFails += 1;
          chunkSize = Math.max(1, Math.floor(chunkSize / 2));
          if (platformFails >= 6) {
            throw new Error(
              `Máy chủ liên tục ngắt kết nối khi sinh câu hỏi (đã thử ${platformFails} lần, sinh được ${allGenerated.length} câu). ` +
              'Nguyên nhân thường gặp: (1) API key Gemini hết hạn mức hoặc sai (429/400) — kiểm tra key trong "Cấu hình API Key"; ' +
              '(2) giới hạn thời gian Vercel — vào Settings → Functions của project bật Fluid Compute rồi bấm thử lại.'
            );
          }
          await new Promise(r => setTimeout(r, 4000));
          round -= 1; // thử lại đợt vừa rồi với số câu nhỏ hơn
          continue;
        }

        if (!res.ok) {
          alert(data.error || 'Không thể kiểm tra/kịp thời sinh câu hỏi bổ sung.');
          break;
        }

        platformFails = 0;
        for (const q of data.questions || []) {
          if (q && q.id && !generatedIds.has(q.id)) {
            generatedIds.add(q.id);
            allGenerated.push(q);
          }
        }
        allErrors.push(...(data.errors || []));
        const remaining: number = data.remaining ?? 0;
        lastRemaining = remaining;
        if (remaining <= 0) break;

        setEnsureLabel(`Đang sinh câu hỏi bổ sung… ${allGenerated.length}/${allGenerated.length + remaining} câu`);

        if ((data.generated || 0) === 0) {
          stallRounds += 1;
          if (stallRounds >= 2) break; // server không còn sinh được thêm — thoát tránh lặp vô hạn
        } else {
          stallRounds = 0;
        }
      }

      mergeGeneratedIntoBank();
      if (allErrors.length) {
        alert(`Đã sinh thêm ${allGenerated.length} câu mới vào ngân hàng, nhưng có một số câu không sinh được (còn thiếu ${lastRemaining} câu):\n\n- ${allErrors.slice(0, 5).join('\n- ')}`);
      } else if (lastRemaining > 0 && allGenerated.length === 0) {
        alert(
          `Không sinh được câu nào cho ma trận này (còn thiếu ${lastRemaining} câu). ` +
          'Vui lòng kiểm tra: (1) API key Gemini còn hạn mức không (bấm "Cấu hình API Key" → Test); ' +
          '(2) nếu đang dùng Vercel, bật Fluid Compute trong Settings → Functions rồi redeploy.'
        );
      }
      return allGenerated;
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối khi sinh câu hỏi bổ sung: ' + (err as Error).message);
      mergeGeneratedIntoBank();
      return allGenerated;
    } finally {
      setIsEnsuringQuestions(false);
      setEnsureLabel('');
    }
  };

  // Fast load sample mau.pdf
  const handleLoadSampleMauPdf = async () => {
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

    const generated = await ensureQuestionsForMatrix(m);
    const pool = [...generated, ...availableQuestions]; // gộp câu vừa sinh vì state chưa kịp cập nhật
    const pkg = buildExamPackage({
      matrix: m,
      availableQuestions: pool,
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
  const handleStep2Next = async () => {
    if (!matrix) return;
    const generated = await ensureQuestionsForMatrix(matrix);
    const pkg = buildExamPackage({
      matrix,
      availableQuestions: [...generated, ...availableQuestions],
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
            isNextBusy={isEnsuringQuestions}
            busyLabel={ensureLabel}
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
