import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import Papa from 'papaparse';

const AUROCDifferencePlot = () => {
  const [data, setData] = useState([]);
  const [avgDifference, setAvgDifference] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const fileContent = await window.fs.readFile('diff.csv', { encoding: 'utf8' });
        
        const parsed = Papa.parse(fileContent, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });

        if (parsed.errors.length > 0) {
          console.error('CSV parsing errors:', parsed.errors);
        }

        const processedData = parsed.data.map((row, index) => {
          // Calculate Neural Net - XGBoost (reverse of XGBoost - Neural Net)
          const nnMinusXgb = (row['Neural Net (AUROC)'] || 0) - (row['Xgboost (AUROC)'] || 0);
          
          return {
            rowIndex: row['Row Index'] !== undefined ? row['Row Index'] : index,
            xgboost: row['Xgboost (AUROC)'] || 0,
            neuralNet: row['Neural Net (AUROC)'] || 0,
            difference: nnMinusXgb,
            originalDifference: row['Difference'] || 0
          };
        });

        // Calculate average difference (Neural Net - XGBoost)
        const validDifferences = processedData
          .map(d => d.difference)
          .filter(d => !isNaN(d));
        
        const avgDiff = validDifferences.reduce((sum, val) => sum + val, 0) / validDifferences.length;

        setData(processedData);
        setAvgDifference(avgDiff);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-xl text-indigo-700 font-medium">Loading data...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            Deep Learning models versus XGBoost over 500 model comparisons
          </h1>
          <p className="text-lg text-slate-600">
            Comparative Analysis of Neural Network and XGBoost AUROC Performance
          </p>
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-white rounded-lg shadow-sm border">
            <span className="text-sm font-medium text-slate-700">
              Average Difference (DL - XGB): 
            </span>
            <span className={`ml-2 px-2 py-1 rounded text-sm font-bold ${
              avgDifference >= 0 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {avgDifference.toFixed(4)}
            </span>
          </div>
        </div>

        {/* Main Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            Deep Learning models versus XGBoost over 500 model comparisons
          </h2>
          <div style={{ width: '100%', height: '500px' }}>
            <ResponsiveContainer>
              <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="rowIndex" 
                  stroke="#64748b"
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Model Comparison Index', position: 'insideBottom', offset: -10, style: { textAnchor: 'middle' } }}
                />
                <YAxis 
                  stroke="#64748b"
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Deep Learning - XGBoost AUROC', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value, name) => [
                    typeof value === 'number' ? value.toFixed(4) : value,
                    name === 'difference' ? 'DL - XGB Difference' : 
                    name === 'neuralNet' ? 'Deep Learning AUROC' :
                    name === 'xgboost' ? 'XGBoost AUROC' : name
                  ]}
                  labelFormatter={(label) => `Comparison: ${label}`}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                />
                
                {/* Zero reference line */}
                <ReferenceLine 
                  y={0} 
                  stroke="#64748b" 
                  strokeDasharray="5 5"
                  label={{ value: "Equal Performance", position: "topRight", style: { fontSize: '12px', fill: '#64748b' } }}
                />
                
                {/* Average difference line */}
                <ReferenceLine 
                  y={avgDifference} 
                  stroke="#dc2626" 
                  strokeWidth={2}
                  label={{ 
                    value: `Average: ${avgDifference.toFixed(3)}`, 
                    position: "topRight", 
                    style: { fontSize: '12px', fill: '#dc2626', fontWeight: 'bold' } 
                  }}
                />
                
                <Line 
                  type="monotone" 
                  dataKey="difference" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 0, r: 2 }}
                  activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#ffffff' }}
                  name="DL - XGB Performance Difference"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="text-sm font-medium text-slate-600">Total Comparisons</div>
            <div className="text-2xl font-bold text-slate-800">{data.length}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="text-sm font-medium text-slate-600">Deep Learning Wins</div>
            <div className="text-2xl font-bold text-emerald-600">
              {data.filter(d => d.difference > 0).length}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {((data.filter(d => d.difference > 0).length / data.length) * 100).toFixed(1)}%
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="text-sm font-medium text-slate-600">XGBoost Wins</div>
            <div className="text-2xl font-bold text-red-600">
              {data.filter(d => d.difference < 0).length}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {((data.filter(d => d.difference < 0).length / data.length) * 100).toFixed(1)}%
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="text-sm font-medium text-slate-600">Tied Performance</div>
            <div className="text-2xl font-bold text-slate-600">
              {data.filter(d => d.difference === 0).length}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {((data.filter(d => d.difference === 0).length / data.length) * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📊</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-800">Performance Trend</h3>
                <p className="text-sm text-blue-700 mt-1">
                  XGBoost shows strongest advantage in early comparisons, with Deep Learning models closing the gap in later evaluations.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">⚡</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-amber-800">Key Finding</h3>
                <p className="text-sm text-amber-700 mt-1">
                  On average, XGBoost outperforms Deep Learning by 0.075 AUROC points across all 500 model comparisons.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
