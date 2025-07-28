import React, { useState } from 'react';
import { Leaf, AlertTriangle, CheckCircle, Shield, Droplets, DollarSign, TrendingUp, Calendar, BarChart3, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { CropRecommendationWithEconomics } from '../types';
import { formatCurrency, formatNumber, getRiskColor, getROIColor, calculateScenarioAnalysis } from '../utils/costBenefitAnalysis';

interface CropCardWithEconomicsProps {
  recommendation: CropRecommendationWithEconomics;
}

export const CropCardWithEconomics: React.FC<CropCardWithEconomicsProps> = ({ recommendation }) => {
  const { crop, suitabilityScore, matchingFactors, warnings, economics, profitabilityScore, riskAdjustedReturn } = recommendation;
  const [showEconomics, setShowEconomics] = useState(false);
  const [showScenarios, setShowScenarios] = useState(false);
  
  const getSuitabilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getSuitabilityText = (score: number) => {
    if (score >= 80) return 'Highly Suitable';
    if (score >= 60) return 'Moderately Suitable';
    return 'Low Suitability';
  };

  const getProfitabilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getProfitabilityText = (score: number) => {
    if (score >= 80) return 'Highly Profitable';
    if (score >= 60) return 'Good Profit';
    if (score >= 40) return 'Moderate Profit';
    return 'Low Profit';
  };

  const scenarios = economics ? calculateScenarioAnalysis(economics) : [];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-green-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Leaf className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{crop.Variety}</h3>
              <p className="text-sm text-gray-600">{crop.Crop} • {crop.Type}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getSuitabilityColor(suitabilityScore)}`}>
              {suitabilityScore}% • {getSuitabilityText(suitabilityScore)}
            </div>
            {economics && (
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getProfitabilityColor(profitabilityScore)}`}>
                {profitabilityScore.toFixed(0)}% • {getProfitabilityText(profitabilityScore)}
              </div>
            )}
          </div>
        </div>

        {/* Quick Economic Overview */}
        {economics && (
          <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div>
                <div className="text-xs text-gray-500 mb-1">Investment</div>
                <div className="font-bold text-gray-800">{formatCurrency(economics.total_production_cost_per_acre)}</div>
                <div className="text-xs text-gray-500">per acre</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Expected Profit</div>
                <div className="font-bold text-green-600">{formatCurrency(economics.net_profit_per_acre)}</div>
                <div className="text-xs text-gray-500">per acre</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">ROI</div>
                <div className={`font-bold ${getROIColor(economics.roi_percentage)}`}>
                  {economics.roi_percentage.toFixed(0)}%
                </div>
                <div className="text-xs text-gray-500">return</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Payback</div>
                <div className="font-bold text-blue-600">{economics.payback_period_months}</div>
                <div className="text-xs text-gray-500">months</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-sm">
            <span className="text-gray-500">Temperature:</span>
            <span className="ml-1 font-medium">{crop.minTemp}-{crop.maxTemp}°C</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Rainfall:</span>
            <span className="ml-1 font-medium">{crop.minPrep}-{crop.maxPrep}mm</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Altitude:</span>
            <span className="ml-1 font-medium">{crop.minAlti}-{crop.maxAlti}m</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">pH Range:</span>
            <span className="ml-1 font-medium">{crop.minpH}-{crop.maxpH}</span>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Soil Types:</h4>
          <div className="flex flex-wrap gap-2">
            {[crop.tex1, crop.tex2, crop.tex3].filter(Boolean).map((soil, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                {soil}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          {crop.drought_tolerant === 1 && (
            <div className="flex items-center gap-1 text-xs text-amber-600">
              <Droplets className="w-3 h-3" />
              <span>Drought Tolerant</span>
            </div>
          )}
          {crop.pest_tolerant === 1 && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <Shield className="w-3 h-3" />
              <span>Pest Resistant</span>
            </div>
          )}
          {crop.availability === 1 && (
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <CheckCircle className="w-3 h-3" />
              <span>Available</span>
            </div>
          )}
          {economics && (
            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${getRiskColor(economics.risk_level)}`}>
              <BarChart3 className="w-3 h-3" />
              <span>{economics.risk_level} Risk</span>
            </div>
          )}
        </div>

        {matchingFactors.length > 0 && (
          <div className="mb-3">
            <h4 className="text-sm font-medium text-green-700 mb-2">✓ Suitable Conditions:</h4>
            <ul className="text-xs text-green-600 space-y-1">
              {matchingFactors.map((factor, index) => (
                <li key={index}>• {factor}</li>
              ))}
            </ul>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-amber-700 mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Considerations:
            </h4>
            <ul className="text-xs text-amber-600 space-y-1">
              {warnings.map((warning, index) => (
                <li key={index}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Economic Details Toggle */}
        {economics && (
          <div className="space-y-3">
            <button
              onClick={() => setShowEconomics(!showEconomics)}
              className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Detailed Cost-Benefit Analysis</span>
              </div>
              {showEconomics ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />}
            </button>

            {showEconomics && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                {/* Cost Breakdown */}
                <div>
                  <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Cost Breakdown (Per Acre)
                  </h5>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Seeds:</span>
                      <span className="font-medium">{formatCurrency(economics.seed_cost_per_kg * economics.seeds_per_acre)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fertilizer:</span>
                      <span className="font-medium">{formatCurrency(economics.fertilizer_cost_per_acre)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pesticides:</span>
                      <span className="font-medium">{formatCurrency(economics.pesticide_cost_per_acre)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Labor:</span>
                      <span className="font-medium">{formatCurrency(economics.labor_cost_per_acre)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Other costs:</span>
                      <span className="font-medium">{formatCurrency(economics.other_costs_per_acre)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-bold">
                      <span className="text-gray-800">Total Cost:</span>
                      <span className="text-red-600">{formatCurrency(economics.total_production_cost_per_acre)}</span>
                    </div>
                  </div>
                </div>

                {/* Revenue & Profit */}
                <div>
                  <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Revenue & Profitability
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expected Yield:</span>
                      <span className="font-medium">{formatNumber(economics.expected_yield_per_acre_kg)} kg/acre</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Market Price:</span>
                      <span className="font-medium">{formatCurrency(economics.market_price_per_kg)}/kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gross Revenue:</span>
                      <span className="font-medium text-green-600">{formatCurrency(economics.gross_revenue_per_acre)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-bold">
                      <span className="text-gray-800">Net Profit:</span>
                      <span className="text-green-600">{formatCurrency(economics.net_profit_per_acre)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Break-even Yield:</span>
                      <span className="font-medium">{formatNumber(economics.break_even_yield_kg)} kg</span>
                    </div>
                  </div>
                </div>

                {/* Risk & Timeline */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Risk Assessment
                    </h5>
                    <div className={`px-3 py-2 rounded-lg text-center ${getRiskColor(economics.risk_level)}`}>
                      <div className="font-bold">{economics.risk_level} Risk</div>
                      <div className="text-xs">Risk-Adjusted ROI: {riskAdjustedReturn.toFixed(0)}%</div>
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Timeline
                    </h5>
                    <div className="bg-blue-100 px-3 py-2 rounded-lg text-center">
                      <div className="font-bold text-blue-800">{economics.payback_period_months} Months</div>
                      <div className="text-xs text-blue-600">Payback Period</div>
                    </div>
                  </div>
                </div>

                {/* Scenario Analysis Toggle */}
                <button
                  onClick={() => setShowScenarios(!showScenarios)}
                  className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">Scenario Analysis</span>
                  </div>
                  {showScenarios ? <ChevronUp className="w-4 h-4 text-purple-600" /> : <ChevronDown className="w-4 h-4 text-purple-600" />}
                </button>

                {showScenarios && (
                  <div className="space-y-3">
                    {scenarios.map((scenario, index) => (
                      <div key={index} className="p-3 bg-white rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <h6 className="font-medium text-gray-800 capitalize">{scenario.scenario}</h6>
                          <span className={`text-sm font-bold ${getROIColor(scenario.roi)}`}>
                            {scenario.roi.toFixed(0)}% ROI
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mb-2">{scenario.description}</div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Yield:</span>
                            <div className="font-medium">{formatNumber(scenario.yield)} kg</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Price:</span>
                            <div className="font-medium">{formatCurrency(scenario.price)}/kg</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Net Profit:</span>
                            <div className={`font-medium ${scenario.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(scenario.netProfit)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};