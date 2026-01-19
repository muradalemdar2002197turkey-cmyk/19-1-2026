
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// تهيئة العميل باستخدام المفتاح من البيئة
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateCourseDescription = async (courseTitle: string): Promise<string> => {
  try {
    const ai = getAI();
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `اكتب وصفاً جذاباً واحترافياً باللغة العربية لكورس إنجليزي بعنوان "${courseTitle}" لطلاب المرحلة الثانوية في مصر. اجعل الوصف يشمل أهمية اللغة وكيف سيساعد هذا الكورس الطالب في تحقيق الدرجة النهائية.`,
      config: {
        temperature: 0.7,
        systemInstruction: "أنت خبير في المناهج التعليمية المصرية، تحديداً اللغة الإنجليزية للمرحلة الثانوية."
      }
    });
    return response.text || "تم إنشاء الوصف بواسطة الذكاء الاصطناعي.";
  } catch (error) {
    console.error("AI Generation Error:", error);
    return "تعذر إنشاء الوصف حالياً، يرجى كتابته يدوياً.";
  }
};

export const generateCertificateContent = async (studentName: string, gradeLabel: string, type: string): Promise<string> => {
  try {
    const ai = getAI();
    const prompt = `اكتب نصاً رسمياً ومؤثراً لشهادة تقدير باللغة العربية للطالب "${studentName}" المقيد في "${gradeLabel}". 
    نوع الشهادة: "${type}". 
    اجعل النص يحتوي على كلمات تشجيعية من مستر مصر تليق بمكانته كمعلم متميز. 
    يجب أن يكون النص قصيراً ومناسباً ليوضع داخل برواز شهادة.`;
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.8
      }
    });
    return response.text || "شهادة تقدير وتفوق مقدمة من مستر مصر.";
  } catch (error) {
    console.error("AI Certificate Error:", error);
    return "نقدر مجهودكم الرائع ونتمنى لكم مزيداً من التوفيق والنجاح.";
  }
};

export const chatWithAI = async (message: string, history: { role: string, parts: { text: string }[] }[]): Promise<string> => {
  try {
    const ai = getAI();
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: "أنت المساعد الذكي الخاص بمنصة 'مستر مصر' لتعلم اللغة الإنجليزية. وظيفتك هي مساعدة الطلاب المصريين في فهم قواعد اللغة الإنجليزية، ترجمة الجمل، وتقديم النصائح الدراسية بروح إيجابية ومشجعة. استخدم لغة عربية بسيطة ومحببة للطلاب.",
      }
    });

    const response: GenerateContentResponse = await chat.sendMessage({ message });
    return response.text || "عذراً، لم أستطع فهم ذلك. هل يمكنك إعادة السؤال؟";
  } catch (error) {
    console.error("AI Chat Error:", error);
    return "عذراً، أواجه مشكلة في الاتصال بالذكاء الاصطناعي حالياً. حاول مرة أخرى لاحقاً.";
  }
};
