/**
 * Bin文件解析器
 * 
 * 文件格式说明：
 * - # 开头的行是注释，忽略
 * - 没有冒号的非空行是模块名
 * - 有冒号的行是参数：name:value
 *   - 单值：up_limit:2200
 *   - 一维列表：matrix1:3 4 5
 *   - 二维列表：参数名后跟冒号，下面缩进的行是数据
 */

class BinParser {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * 解析bin文件内容
   * @param {string} content - 文件内容
   * @param {string} filename - 文件名（用于错误提示）
   * @returns {object} 解析结果
   */
  parse(content, filename = 'unknown') {
    this.errors = [];
    this.warnings = [];
    
    const result = {
      success: true,
      filename,
      modules: [],
      errors: [],
      warnings: []
    };

    if (!content || typeof content !== 'string') {
      this.addError(0, '文件内容为空或格式无效');
      return this.buildResult(result);
    }

    const lines = content.split(/\r?\n/);
    let currentModule = null;
    let pendingMultilineParam = null;
    let multilineData = [];

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const rawLine = lines[i];
      const line = rawLine.trim();

      // 处理多行参数的后续行（缩进的行）
      if (pendingMultilineParam !== null) {
        // 检查是否是缩进的数据行
        if (rawLine.startsWith('    ') || rawLine.startsWith('\t')) {
          const rowData = this.parseRowValues(line, lineNum);
          if (rowData.length > 0) {
            multilineData.push(rowData);
          }
          continue;
        } else {
          // 多行参数结束，保存数据
          if (currentModule && pendingMultilineParam) {
            currentModule.params.push({
              name: pendingMultilineParam.name,
              value: multilineData,
              type: 'matrix',
              lineNum: pendingMultilineParam.lineNum
            });
          }
          pendingMultilineParam = null;
          multilineData = [];
        }
      }

      // 跳过空行
      if (line === '') {
        continue;
      }

      // 注释行
      if (line.startsWith('#')) {
        continue;
      }

      // 检查是否是参数行（包含冒号）
      if (line.includes(':')) {
        const colonIndex = line.indexOf(':');
        const paramName = line.substring(0, colonIndex).trim();
        const paramValue = line.substring(colonIndex + 1).trim();

        // 验证参数名
        if (!paramName) {
          this.addError(lineNum, '参数名不能为空');
          continue;
        }

        if (!this.isValidParamName(paramName)) {
          this.addWarning(lineNum, `参数名 "${paramName}" 包含非法字符，建议使用字母、数字和下划线`);
        }

        // 检查是否有当前模块
        if (!currentModule) {
          this.addError(lineNum, `参数 "${paramName}" 没有所属模块，请先定义模块名`);
          continue;
        }

        // 检查参数是否重复
        if (currentModule.params.some(p => p.name === paramName)) {
          this.addWarning(lineNum, `模块 "${currentModule.name}" 中参数 "${paramName}" 重复定义，将使用最后一个值`);
          currentModule.params = currentModule.params.filter(p => p.name !== paramName);
        }

        // 判断参数类型
        if (paramValue === '') {
          // 多行参数开始
          pendingMultilineParam = { name: paramName, lineNum: lineNum };
          multilineData = [];
        } else if (paramValue.includes(' ')) {
          // 一维数组
          const values = this.parseRowValues(paramValue, lineNum);
          currentModule.params.push({
            name: paramName,
            value: values,
            type: 'array',
            lineNum
          });
        } else {
          // 单值
          const value = this.parseValue(paramValue, lineNum);
          currentModule.params.push({
            name: paramName,
            value: value,
            type: 'single',
            lineNum
          });
        }
      } else {
        // 模块名行
        const moduleName = line;

        if (!this.isValidModuleName(moduleName)) {
          this.addWarning(lineNum, `模块名 "${moduleName}" 格式不规范，建议使用大写字母和下划线`);
        }

        // 检查模块是否重复
        if (result.modules.some(m => m.name === moduleName)) {
          this.addWarning(lineNum, `模块 "${moduleName}" 重复定义`);
        }

        currentModule = {
          name: moduleName,
          params: [],
          lineNum
        };
        result.modules.push(currentModule);
      }
    }

    // 处理文件末尾的多行参数
    if (pendingMultilineParam !== null && currentModule) {
      currentModule.params.push({
        name: pendingMultilineParam.name,
        value: multilineData,
        type: 'matrix',
        lineNum: pendingMultilineParam.lineNum || 0
      });
    }

    // 验证结果
    if (result.modules.length === 0) {
      this.addError(0, '文件中没有找到任何模块定义');
    }

    return this.buildResult(result);
  }

  /**
   * 解析一行中的多个值
   */
  parseRowValues(str, lineNum) {
    const values = str.trim().split(/\s+/);
    return values.map(v => this.parseValue(v, lineNum));
  }

  /**
   * 解析单个值
   */
  parseValue(str, lineNum) {
    const trimmed = str.trim();
    
    // 尝试解析为数字
    if (/^-?\d+$/.test(trimmed)) {
      return parseInt(trimmed, 10);
    }
    if (/^-?\d+\.?\d*$/.test(trimmed) || /^-?\d*\.\d+$/.test(trimmed)) {
      return parseFloat(trimmed);
    }
    
    // 布尔值
    if (trimmed.toLowerCase() === 'true') return true;
    if (trimmed.toLowerCase() === 'false') return false;
    
    // 字符串
    return trimmed;
  }

  /**
   * 验证参数名
   */
  isValidParamName(name) {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
  }

  /**
   * 验证模块名
   */
  isValidModuleName(name) {
    return /^[A-Z_][A-Z0-9_]*$/.test(name);
  }

  /**
   * 添加错误
   */
  addError(lineNum, message) {
    this.errors.push({ lineNum, message, type: 'error' });
  }

  /**
   * 添加警告
   */
  addWarning(lineNum, message) {
    this.warnings.push({ lineNum, message, type: 'warning' });
  }

  /**
   * 构建返回结果
   */
  buildResult(result) {
    result.errors = this.errors;
    result.warnings = this.warnings;
    result.success = this.errors.length === 0;
    return result;
  }

  /**
   * 将解析后的数据转换回bin文件格式
   * @param {object} data - 解析后的数据
   * @returns {string} bin文件内容
   */
  stringify(data) {
    const lines = [];
    
    lines.push('# 自动生成的模型文件');
    lines.push(`# 生成时间: ${new Date().toLocaleString('zh-CN')}`);
    lines.push('');

    for (const module of data.modules) {
      lines.push(`# ${module.name}`);
      lines.push(module.name);
      
      for (const param of module.params) {
        if (param.type === 'matrix' && Array.isArray(param.value)) {
          lines.push(`${param.name}:`);
          for (const row of param.value) {
            lines.push('    ' + row.join(' '));
          }
        } else if (param.type === 'array' && Array.isArray(param.value)) {
          lines.push(`${param.name}:${param.value.join(' ')}`);
        } else {
          lines.push(`${param.name}:${param.value}`);
        }
      }
      
      lines.push('');
    }

    return lines.join('\n');
  }
}

module.exports = BinParser;

