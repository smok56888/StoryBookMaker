import { jsPDF } from 'jspdf';

// 添加中文字体支持
export function addFonts(doc: jsPDF) {
  // 使用 jsPDF 内置的中文字体支持
  // 这里我们使用 SimSun (宋体) 作为默认字体
  
  // 注意：jsPDF 2.0+ 版本已经内置了一些中文字体支持
  // 如果需要更多字体，可以使用 vfs_fonts.js 添加自定义字体
  
  // 设置默认字体
  doc.setFont('SimSun');
  
  // 如果需要添加更多字体，可以使用以下方法：
  // doc.addFont('path/to/font.ttf', 'FontName', 'normal');
  // doc.setFont('FontName');
  
  return doc;
}