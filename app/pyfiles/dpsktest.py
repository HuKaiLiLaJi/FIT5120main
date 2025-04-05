import requests

class DeepSeekAPITester:
    def __init__(self, api_key):
        """
        初始化DeepSeek API测试器
        
        参数:
            api_key (str): 你的DeepSeek API密钥
        """
        self.api_key = api_key
        self.base_url = "https://api.deepseek.com/v1/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    def send_request(self, prompt, model="deepseek-chat", temperature=0.7, max_tokens=2000, stream=False):
        """
        发送请求到DeepSeek API
        
        参数:
            prompt (str): 用户输入的提示词
            model (str): 使用的模型名称
            temperature (float): 生成文本的随机性
            max_tokens (int): 最大生成token数
            stream (bool): 是否使用流式响应
            
        返回:
            dict: API响应数据
        """
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream
        }
        
        try:
            if stream:
                response = requests.post(
                    self.base_url,
                    json=payload,
                    headers=self.headers,
                    stream=True
                )
                return self._handle_streaming_response(response)
            else:
                response = requests.post(
                    self.base_url,
                    json=payload,
                    headers=self.headers
                )
                return self._handle_regular_response(response)
        except Exception as e:
            return {"error": str(e)}
    
    def _handle_regular_response(self, response):
        """处理常规响应"""
        if response.status_code == 200:
            return response.json()
        else:
            return {
                "error": f"API请求失败",
                "status_code": response.status_code,
                "response": response.text
            }
    
    def _handle_streaming_response(self, response):
        """处理流式响应"""
        if response.status_code != 200:
            return {
                "error": f"API请求失败",
                "status_code": response.status_code,
                "response": response.text
            }
        
        print("\n流式响应结果:")
        full_response = ""
        for line in response.iter_lines():
            if line:
                decoded_line = line.decode('utf-8')
                if decoded_line.startswith("data:"):
                    data = decoded_line[5:].strip()
                    if data != "[DONE]":
                        try:
                            json_data = eval(data)  # 注意：实际使用中应考虑更安全的JSON解析方式
                            content = json_data.get("choices", [{}])[0].get("delta", {}).get("content", "")
                            if content:
                                print(content, end="", flush=True)
                                full_response += content
                        except:
                            pass
        return {"response": full_response}
    
    def run_test_cases(self):
        """运行一系列测试用例"""
        test_cases = [
            {
                "prompt": "你好，请介绍一下DeepSeek",
                "model": "deepseek-chat",
                "temperature": 0.7
            },
            {
                "prompt": "用Python实现快速排序算法，并添加详细注释",
                "model": "deepseek-chat",
                "temperature": 0.3
            },
            {
                "prompt": "写一篇关于人工智能未来发展的短文，约200字",
                "model": "deepseek-chat",
                "temperature": 0.9
            },
            {
                "prompt": "解释量子计算的基本原理",
                "model": "deepseek-chat",
                "temperature": 0.5,
                "stream": True
            }
        ]
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n{'='*50}")
            print(f"测试用例 #{i}: {test_case['prompt']}")
            print(f"参数: model={test_case.get('model')}, temperature={test_case.get('temperature', 0.7)}")
            
            result = self.send_request(
                prompt=test_case["prompt"],
                model=test_case.get("model", "deepseek-chat"),
                temperature=test_case.get("temperature", 0.7),
                max_tokens=test_case.get("max_tokens", 2000),
                stream=test_case.get("stream", False)
            )
            
            if not test_case.get("stream", False):
                if "error" in result:
                    print(f"错误: {result['error']}")
                else:
                    response_content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                    print("\n响应内容:")
                    print(response_content)


if __name__ == "__main__":
    # 替换为你的实际API密钥
    API_KEY = ""
    
    if API_KEY == "your_api_key_here":
        print("请替换脚本中的API_KEY为你的实际DeepSeek API密钥")
    else:
        tester = DeepSeekAPITester(API_KEY)
        print("开始DeepSeek API测试...")
        tester.run_test_cases()
        print("\n测试完成！")