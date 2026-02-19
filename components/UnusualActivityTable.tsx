
import React from 'react';
import type { OptionContract } from '../types';
import { TrendingUpIcon } from './icons/TrendingUpIcon';

interface UnusualActivityTableProps {
    contracts: OptionContract[];
    onRowClick: (contract: OptionContract) => void;
    selectedContractId?: string | null;
}

const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const UnusualActivityTable: React.FC<UnusualActivityTableProps> = ({ contracts, onRowClick, selectedContractId }) => {
    const sortedContracts = [...contracts]
        .sort((a, b) => (b.volume * b.underlyingPrice) - (a.volume * a.underlyingPrice))
        .slice(0, 10); 

    return (
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
             <div className="px-6 py-5 border-b border-slate-800/50 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-3 tracking-tight">
                        <TrendingUpIcon className="w-5 h-5 text-amber-500" />
                        Flow Monitoring
                    </h3>
                    <p className="text-[10px] text-white uppercase tracking-widest mt-0.5 font-bold">Unusual Trade Stream</p>
                </div>
                <div className="hidden sm:block">
                    <span className="text-[9px] font-black text-white uppercase tracking-widest border border-slate-800 px-2.5 py-1 rounded-full">
                        Live: Deribit
                    </span>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                    <thead className="text-[9px] font-black text-white uppercase tracking-[0.2em] bg-slate-900/50">
                        <tr>
                            <th className="px-6 py-3">Expiration</th>
                            <th className="px-6 py-3">Strike</th>
                            <th className="px-6 py-3 text-center">Type</th>
                            <th className="px-6 py-3 text-right">Volume</th>
                            <th className="px-6 py-3 text-right">Intensity</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30">
                        {sortedContracts.map((contract) => {
                            const isCall = contract.type === 'CALL';
                            const isSelected = selectedContractId === contract.id;
                            const volRatio = contract.openInterest > 0 ? (contract.volume / contract.openInterest).toFixed(1) : 'NEW';
                            
                            return (
                                <tr
                                    key={contract.id}
                                    onClick={() => onRowClick(contract)}
                                    className={`group hover:bg-slate-800/40 cursor-pointer transition-all duration-300 ${isSelected ? 'bg-amber-500/10 border-l-2 border-l-amber-500' : 'border-l-2 border-l-transparent'}`}
                                >
                                    <td className="px-6 py-3.5 font-bold text-white group-hover:text-amber-500 transition-colors">{contract.expirationDate}</td>
                                    <td className="px-6 py-3.5">
                                        <span className="font-black text-white text-base tracking-tighter">${contract.strikePrice.toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-3.5 text-center">
                                        <span className={`px-3 py-1 rounded-md text-[9px] font-black tracking-widest border ${isCall ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                            {contract.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3.5 text-right font-bold text-white">
                                        {formatNumber(contract.volume)}
                                    </td>
                                    <td className="px-6 py-3.5 text-right">
                                        <span className="text-[9px] font-black bg-slate-800/80 text-white px-2 py-0.5 rounded border border-slate-700/50">
                                            {volRatio}x
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {sortedContracts.length === 0 && (
                <div className="p-16 text-center">
                    <p className="text-white font-bold uppercase tracking-widest text-[10px]">No significant flow detected.</p>
                </div>
            )}
        </div>
    );
};
