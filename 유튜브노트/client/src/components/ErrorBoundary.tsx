import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          backgroundColor: '#fee',
          border: '2px solid #f00',
          borderRadius: '8px',
          margin: '20px',
          fontFamily: 'monospace'
        }}>
          <h2>오류가 발생했습니다!</h2>
          <details style={{ marginTop: '10px' }}>
            <summary>에러 상세정보 (클릭해서 보기)</summary>
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fff' }}>
              <h3>에러 메시지:</h3>
              <p style={{ color: 'red' }}>{this.state.error?.message}</p>
              
              <h3>에러 스택:</h3>
              <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                {this.state.error?.stack}
              </pre>
              
              {this.state.errorInfo && (
                <>
                  <h3>컴포넌트 스택:</h3>
                  <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                </>
              )}
            </div>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;