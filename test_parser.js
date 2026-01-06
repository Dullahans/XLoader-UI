/**
 * Bin文件解析器测试脚本
 * 运行: node test_parser.js
 */

const fs = require('fs');
const path = require('path');
const BinParser = require('./server/utils/binParser');

const parser = new BinParser();
const binDir = path.join(__dirname, 'data/bin_files');

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║            Bin文件解析器测试                                   ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

// 获取所有bin文件
const files = fs.readdirSync(binDir).filter(f => f.endsWith('.bin'));

files.forEach(filename => {
  const filepath = path.join(binDir, filename);
  const content = fs.readFileSync(filepath, 'utf-8');
  
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📄 文件: ${filename}`);
  console.log('═'.repeat(60));
  
  const result = parser.parse(content, filename);
  
  // 显示解析状态
  if (result.success) {
    console.log('✅ 解析成功');
  } else {
    console.log('❌ 解析失败');
  }
  
  // 显示错误
  if (result.errors.length > 0) {
    console.log('\n🔴 错误:');
    result.errors.forEach(err => {
      console.log(`   行 ${err.lineNum}: ${err.message}`);
    });
  }
  
  // 显示警告
  if (result.warnings.length > 0) {
    console.log('\n🟡 警告:');
    result.warnings.forEach(warn => {
      console.log(`   行 ${warn.lineNum}: ${warn.message}`);
    });
  }
  
  // 显示解析结果
  if (result.modules.length > 0) {
    console.log('\n📦 模块列表:');
    result.modules.forEach(mod => {
      console.log(`   [${mod.name}] (${mod.params.length} 个参数)`);
      mod.params.forEach(param => {
        let valueStr;
        if (param.type === 'matrix') {
          valueStr = `[${param.value.length}行矩阵]`;
        } else if (param.type === 'array') {
          valueStr = `[${param.value.join(', ')}]`;
        } else {
          valueStr = param.value;
        }
        console.log(`      - ${param.name}: ${valueStr} (${param.type})`);
      });
    });
  }
});

console.log('\n\n' + '═'.repeat(60));
console.log('测试完成');
console.log('═'.repeat(60));



