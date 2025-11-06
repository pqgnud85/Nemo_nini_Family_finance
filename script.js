

        document.addEventListener('DOMContentLoaded', () => {
            // Lấy tham chiếu các phần tử
            const calculateButton = document.getElementById('calculateButton');
            const cashFlowBody = document.getElementById('cashFlowBody');
            const analysisOutput = document.getElementById('analysisOutput');
            
            // --- CÁC HÀM TIỆN ÍCH ---

            // Hàm lấy giá trị từ input
            function getVal(id, isNumber = true) {
                const el = document.getElementById(id);
                if (!el) {
                    console.error('Không tìm thấy phần tử với id:', id);
                    return isNumber ? 0 : '';
                }
                let value = el.value;
                if (isNumber) {
                    return parseFloat(value) || 0;
                }
                return value;
            }

            // Hàm định dạng số (Đơn vị: Triệu VNĐ)
            function formatCurrency(num) {
                if (num === 0) return '0';
                // Làm tròn đến 0 chữ số thập phân
                return new Intl.NumberFormat('vi-VN').format(num.toFixed(0));
            }

            // Hàm điền các lựa chọn cho thẻ <select> (từ 0 đến 100)
            function populateSelect(id, start, end, step, defaultVal, suffix = '', isPercent = false) {
                const select = document.getElementById(id);
                if (!select) return;
                select.innerHTML = ''; // Xóa option cũ
                for (let i = start; i <= end; i += step) {
                    const option = document.createElement('option');
                    let val = i;
                    if (isPercent) val = i / 100; // Lưu giá trị thực (vd: 0.06)
                    
                    option.value = val;
                    option.text = `${i}${suffix}`;
                    if (Math.abs(val - defaultVal) < 0.0001) { // So sánh số float
                        option.selected = true;
                    }
                    select.appendChild(option);
                }
            }

            // Hàm điền các lựa chọn cho năm
            function populateYearSelect(id, startYear, endYear, defaultVal, includeEmpty = false) {
                const select = document.getElementById(id);
                if (!select) return;
                select.innerHTML = ''; // Xóa option cũ

                if (includeEmpty) {
                    const option = document.createElement('option');
                    option.value = "9999"; // Năm kết thúc vô hạn
                    option.text = "Không có";
                    select.appendChild(option);
                }

                for (let i = startYear; i <= endYear; i++) {
                    const option = document.createElement('option');
                    option.value = i;
                    option.text = i;
                    if (i === defaultVal) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                }
            }
             // Hàm điền các lựa chọn cho tháng
            function populateMonthSelect(id, defaultVal) {
                const select = document.getElementById(id);
                if (!select) return;
                select.innerHTML = ''; // Xóa option cũ
                for (let i = 1; i <= 12; i++) {
                    const option = document.createElement('option');
                    option.value = i;
                    option.text = `Tháng ${i}`;
                    if (i === defaultVal) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                }
            }
            
            // Hàm đồng bộ phần trăm (Tổng 100%)
            function syncPercentage(changedId, targetId) {
                const changed = document.getElementById(changedId);
                const target = document.getElementById(targetId);
                if (!changed || !target) return;

                let changedVal = parseFloat(changed.value); // 0.0 -> 1.0
                let targetVal = 1.0 - changedVal;

                // Tìm option gần nhất
                let closestOption = [...target.options].reduce((prev, curr) => {
                    return (Math.abs(parseFloat(curr.value) - targetVal) < Math.abs(parseFloat(prev.value) - targetVal) ? curr : prev);
                });
                target.value = closestOption.value;
            }


            // --- HÀM KHỞI TẠO DROPDOWN ---
            function populateDropdowns() {
                const pStartYear = 2024;
                const pEndYear = 2065;

                // 2.1 Thị trường
                populateSelect('savingsRate', 1, 15, 1, 0.06, '%', true); // 6%
                populateSelect('stocksRate', 1, 20, 1, 0.08, '%', true); // 8%
                populateSelect('inflation', 0, 10, 1, 0.04, '%', true); // 4%

                // 2.3 Thu nhập Lương
                populateMonthSelect('wifeRetireMonth', 12); 
                populateYearSelect('wifeRetireYear', 2024, 2060, 2035); // Vợ nghỉ 2035
                populateMonthSelect('husbandRetireMonth', 12); 
                populateYearSelect('husbandRetireYear', 2024, 2060, 2030); // Chồng nghỉ 2030

                // Thu nhập thụ động
                populateYearSelect('p1_start', pStartYear, pEndYear, 2028);
                populateYearSelect('p1_end', pStartYear, pEndYear, 9999, true);
                populateSelect('p1_growth', 0, 20, 1, 0.01, '%', true); // 1%
                populateYearSelect('p2_start', pStartYear, pEndYear, 2028);
                populateYearSelect('p2_end', pStartYear, pEndYear, 9999, true);
                populateSelect('p2_growth', 0, 20, 1, 0.00, '%', true);
                populateYearSelect('p3_start', pStartYear, pEndYear, 2028);
                populateYearSelect('p3_end', pStartYear, pEndYear, 9999, true);
                populateSelect('p3_growth', 0, 20, 1, 0.00, '%', true);
                populateYearSelect('p4_start', pStartYear, pEndYear, 2028);
                populateYearSelect('p4_end', pStartYear, pEndYear, 9999, true);
                populateSelect('p4_growth', 0, 20, 1, 0.00, '%', true);

                // Phân bổ thặng dư
                populateSelect('surplusToSavings', 0, 100, 5, 1.0, '%', true); // 100%
                populateSelect('surplusToStocks', 0, 100, 5, 0.0, '%', true); // 0%
                
                // Phân bổ bán đất (mặc định 75/25)
                populateSelect('sellLand1ToSavings', 0, 100, 5, 0.75, '%', true); 
                populateSelect('sellLand1ToStocks', 0, 100, 5, 0.25, '%', true); 
                populateSelect('sellLand2ToSavings', 0, 100, 5, 0.75, '%', true); 
                populateSelect('sellLand2ToStocks', 0, 100, 5, 0.25, '%', true); 


                // 2.4 Sự kiện Chi tiêu
                populateYearSelect('moveYear', pStartYear, pEndYear, 2031);
                populateSelect('moveReduction', 0, 100, 5, 0.15, '%', true); // 15%
                populateYearSelect('childMarriageYear', pStartYear, pEndYear, 2050);
                populateSelect('childMarriageReduction', 0, 100, 5, 0.30, '%', true); // 30%

                // Sự kiện Bán/Mua
                populateYearSelect('sellLand1Year', pStartYear, pEndYear, 2027);
                populateYearSelect('sellLand2Year', pStartYear, pEndYear, 2028);
                populateYearSelect('sellLumiYear', pStartYear, pEndYear, 2031);
                
                populateYearSelect('rentStartYear', pStartYear, pEndYear, 2031);
                populateYearSelect('rentEndYear', pStartYear, pEndYear, 2033);
                populateYearSelect('newHouseBuyYear', pStartYear, pEndYear, 2034);
            }

            // --- HÀM TÍNH TOÁN CHÍNH ---
            function calculateAndRender() {
                // 1. Lấy tất cả giá trị đầu vào
                const inputs = {
                    // 2.0 Tài sản
                    savings: getVal('savings'),
                    stocks: getVal('stocks'),
                    land: getVal('land'),
                    lumi: getVal('lumi'),
                    // 2.1 Thị trường
                    savingsRate: getVal('savingsRate'),
                    stocksRate: getVal('stocksRate'),
                    inflation: getVal('inflation'),
                    // 2.2 Chi tiêu
                    monthlyExpense: getVal('monthlyExpense'),
                    // 2.3 Thu nhập Lương
                    wifeSalary: getVal('wifeSalary'),
                    wifeRetireMonth: getVal('wifeRetireMonth'),
                    wifeRetireYear: getVal('wifeRetireYear'),
                    husbandSalary: getVal('husbandSalary'),
                    husbandRetireMonth: getVal('husbandRetireMonth'),
                    husbandRetireYear: getVal('husbandRetireYear'),
                    surplusToSavings: getVal('surplusToSavings'),
                    surplusToStocks: getVal('surplusToStocks'),
                    // Thu nhập thụ động
                    passive: [
                        { name: getVal('p1_name', false), income: getVal('p1_income'), invest: getVal('p1_invest'), start: getVal('p1_start'), end: getVal('p1_end'), growth: getVal('p1_growth') },
                        { name: getVal('p2_name', false), income: getVal('p2_income'), invest: getVal('p2_invest'), start: getVal('p2_start'), end: getVal('p2_end'), growth: getVal('p2_growth') },
                        { name: getVal('p3_name', false), income: getVal('p3_income'), invest: getVal('p3_invest'), start: getVal('p3_start'), end: getVal('p3_end'), growth: getVal('p3_growth') },
                        { name: getVal('p4_name', false), income: getVal('p4_income'), invest: getVal('p4_invest'), start: getVal('p4_start'), end: getVal('p4_end'), growth: getVal('p4_growth') },
                    ],
                    // 2.4 Sự kiện
                    moveYear: getVal('moveYear'),
                    moveReduction: getVal('moveReduction'),
                    childMarriageYear: getVal('childMarriageYear'),
                    childMarriageReduction: getVal('childMarriageReduction'),
                    // Land Sales
                    sellLand1Year: getVal('sellLand1Year'),
                    sellLand1Value: getVal('sellLand1Value'),
                    sellLand1ToSavings: getVal('sellLand1ToSavings'),
                    sellLand1ToStocks: getVal('sellLand1ToStocks'),
                    sellLand2Year: getVal('sellLand2Year'),
                    sellLand2Value: getVal('sellLand2Value'),
                    sellLand2ToSavings: getVal('sellLand2ToSavings'),
                    sellLand2ToStocks: getVal('sellLand2ToStocks'),
                    // Lumi/Rent/New House
                    sellLumiYear: getVal('sellLumiYear'),
                    sellLumiValue: getVal('sellLumiValue'),
                    rentStartYear: getVal('rentStartYear'),
                    rentEndYear: getVal('rentEndYear'),
                    monthlyRentExpense: getVal('monthlyRentExpense'),
                    newHouseBuyYear: getVal('newHouseBuyYear'),
                    newHouseValue: getVal('newHouseValue'),
                };

                // Khởi tạo biến cho vòng lặp
                let results = [];
                let currentStartAssets = {
                    savings: inputs.savings,
                    stocks: inputs.stocks,
                    land: inputs.land,
                    lumi: inputs.lumi,
                    newHouse: 0
                };
                let prevYearExpense = inputs.monthlyExpense * 12;
                
                // Trạng thái thu nhập thụ động (theo dõi giá trị tăng trưởng)
                let passiveTrack = inputs.passive.map(p => p.income);

                const UNEMPLOYMENT_BENEFIT = 126.72; // 126.72 triệu
                const START_YEAR = 2026;
                const NUM_YEARS = 40;

                // 2. Vòng lặp tính toán 40 năm
                for (let i = 0; i < NUM_YEARS; i++) {
                    const year = START_YEAR + i;
                    let row = {
                        year: year,
                        startSavings: currentStartAssets.savings,
                        startStocks: currentStartAssets.stocks,
                        startAssets: currentStartAssets.savings + currentStartAssets.stocks + currentStartAssets.land + currentStartAssets.lumi + currentStartAssets.newHouse,
                        annualExpense: 0,
                        notes: []
                    };

                    // --- Tính Chi Tiêu CƠ BẢN (Inflation, Events) ---
                    let expenseMultiplier = 1;
                    if (year === START_YEAR) {
                        // Giữ nguyên mức chi tiêu năm đầu
                    } else if (year === inputs.moveYear) {
                        expenseMultiplier = (1 - inputs.moveReduction);
                        row.notes.push(`Giảm chi tiêu ${inputs.moveReduction*100}% (Chuyển nơi sống)`);
                    } else if (year === inputs.childMarriageYear) {
                        expenseMultiplier = (1 - inputs.childMarriageReduction);
                        row.notes.push(`Giảm chi tiêu ${inputs.childMarriageReduction*100}% (Con lập gia đình)`);
                    } else {
                        // Áp dụng lạm phát
                        expenseMultiplier = (1 + inputs.inflation);
                    }
                    
                    if (year === START_YEAR) {
                        row.annualExpense = prevYearExpense;
                    } else {
                        row.annualExpense = prevYearExpense * expenseMultiplier;
                    }
                    prevYearExpense = row.annualExpense; // Cập nhật cho năm sau
                    
                    // --- Thêm Chi tiêu THUÊ NHÀ (Rent Expense) ---
                    if (year >= inputs.rentStartYear && year <= inputs.rentEndYear) {
                        let rent = inputs.monthlyRentExpense * 12;
                        row.annualExpense += rent;
                        row.notes.push(`Chi tiêu Thuê nhà: ${formatCurrency(rent)}`);
                    }


                    // --- Tính Lãi (từ tài sản ĐẦU NĂM) ---
                    row.savingsInterest = row.startSavings * inputs.savingsRate;
                    row.stocksInterest = row.startStocks * inputs.stocksRate;

                    // --- Tính Thu Nhập (Lương, BHTN, Thụ Động) ---
                    let totalSalaryIncome = 0;
                    
                    // Thu nhập VỢ
                    if (year < inputs.wifeRetireYear) {
                        totalSalaryIncome += inputs.wifeSalary * 12;
                    } else if (year === inputs.wifeRetireYear && inputs.wifeRetireMonth > 0) {
                        totalSalaryIncome += inputs.wifeSalary * inputs.wifeRetireMonth;
                        row.notes.push(`Vợ nghỉ hưu T${inputs.wifeRetireMonth}/${year}`);
                    }
                    
                    // Thu nhập CHỒNG
                    if (year < inputs.husbandRetireYear) {
                        totalSalaryIncome += inputs.husbandSalary * 12;
                    } else if (year === inputs.husbandRetireYear && inputs.husbandRetireMonth > 0) {
                        totalSalaryIncome += inputs.husbandSalary * inputs.husbandRetireMonth;
                        row.notes.push(`Chồng nghỉ hưu T${inputs.husbandRetireMonth}/${year}`);
                    }
                    
                    // BHTN - Được nhận 1 năm sau khi nghỉ (hoặc ngay trong năm nếu nghỉ sớm)
                    let unemploymentBenefit = 0;
                    if (year === inputs.wifeRetireYear) {
                        unemploymentBenefit += UNEMPLOYMENT_BENEFIT;
                        row.notes.push("Vợ nhận BHTN");
                    }
                    if (year === inputs.husbandRetireYear) {
                         unemploymentBenefit += UNEMPLOYMENT_BENEFIT;
                         row.notes.push("Chồng nhận BHTN");
                    }

                    let passiveIncomeTotal = 0;
                    for (let j = 0; j < passiveTrack.length; j++) {
                        const p = inputs.passive[j];
                        const pName = p.name || 'Nguồn ' + (j + 1);

                        if (year === p.start && p.income > 0) {
                             row.notes.push(`BĐ TTTĐ: '${pName}'`);
                        }
                        if (year >= p.start && year < p.end) { // Thu nhập thụ động theo dõi từ năm bắt đầu đến năm trước năm kết thúc
                            let currentPassive = passiveTrack[j] * 12;
                            passiveIncomeTotal += currentPassive;
                            passiveTrack[j] *= (1 + p.growth);
                        }
                        if (year === p.end && p.income > 0) {
                            passiveIncomeTotal += passiveTrack[j] * 12; // Nhận năm cuối cùng
                            passiveTrack[j] = 0; // Đặt về 0 cho các năm sau
                            row.notes.push(`KT TTTĐ: '${pName}'`);
                        }
                    }
                    
                    row.nonInterestIncome = totalSalaryIncome + unemploymentBenefit + passiveIncomeTotal;

                    // --- Tính Thặng Dư ---
                    let totalIncome = row.savingsInterest + row.stocksInterest + row.nonInterestIncome;
                    row.surplus = totalIncome - row.annualExpense;
                    
                    // --- Phân bổ Thặng Dư/Thiếu Hụt ---
                    row.endSavings = row.startSavings;
                    row.endStocks = row.startStocks;

                    if (row.surplus > 0) {
                        row.endSavings += row.surplus * inputs.surplusToSavings;
                        row.endStocks += row.surplus * inputs.surplusToStocks;
                    } else {
                        row.endSavings += row.surplus; // surplus là số âm, rút STK
                        row.notes.push("Rút STK bù chi tiêu");
                    }

                    // --- Xử lý Sự Kiện Tài Sản (Cập nhật cuối năm) ---
                    let endLand = currentStartAssets.land;
                    let endLumi = currentStartAssets.lumi;
                    let endNewHouse = currentStartAssets.newHouse;

                    // Đầu tư TTTĐ
                    for (let j = 0; j < inputs.passive.length; j++) {
                        const p = inputs.passive[j];
                        if (year === p.start && p.invest > 0) {
                            row.endSavings -= p.invest;
                            row.notes.push(`Đầu tư TTTĐ '${p.name || 'Nguồn ' + (j+1)}' (${formatCurrency(p.invest)} từ STK)`);
                        }
                    }

                    // Sự kiện cố định 2027
                    if (year === 2027) {
                        row.endSavings -= 3700; 
                        endLumi = 5500; 
                        row.notes.push("Mua full Lumi (3.7 tỉ từ STK)");
                        row.endSavings += 500; 
                        row.notes.push("GĐ hỗ trợ (0.5 tỉ vào STK)");
                    }

                    // Bán đất 1
                    if (year === inputs.sellLand1Year && inputs.sellLand1Value > 0) {
                        endLand -= inputs.sellLand1Value; 
                        let proceeds = inputs.sellLand1Value;
                        row.endSavings += proceeds * inputs.sellLand1ToSavings;
                        row.endStocks += proceeds * inputs.sellLand1ToStocks;
                        row.notes.push(`Bán đất 1 (Giá trị ${formatCurrency(proceeds)}, ${inputs.sellLand1ToSavings*100}% vào STK)`);
                    }
                    
                    // Bán đất 2
                    if (year === inputs.sellLand2Year && inputs.sellLand2Value > 0) {
                        endLand -= inputs.sellLand2Value; 
                        let proceeds = inputs.sellLand2Value;
                        row.endSavings += proceeds * inputs.sellLand2ToSavings;
                        row.endStocks += proceeds * inputs.sellLand2ToStocks;
                        row.notes.push(`Bán đất 2 (Giá trị ${formatCurrency(proceeds)}, ${inputs.sellLand2ToSavings*100}% vào STK)`);
                    }

                    // Bán Lumi
                    if (year === inputs.sellLumiYear) {
                        endLumi = 0; 
                        row.endSavings += inputs.sellLumiValue;
                        row.notes.push(`Bán Lumi (${formatCurrency(inputs.sellLumiValue)}), tiền vào STK.`);
                    }
                    
                    // Mua nhà mới
                    if (year === inputs.newHouseBuyYear) {
                        endNewHouse = inputs.newHouseValue; 
                        row.endSavings -= inputs.newHouseValue;
                        row.notes.push(`Mua nhà khác (${formatCurrency(inputs.newHouseValue)}), rút từ STK.`);
                    }


                    // --- Tính Tài Sản Cuối Năm ---
                    row.endAssets = row.endSavings + row.endStocks + endLand + endLumi + endNewHouse;

                    // Cập nhật tài sản cho đầu năm sau
                    currentStartAssets = {
                        savings: row.endSavings,
                        stocks: row.endStocks,
                        land: endLand,
                        lumi: endLumi,
                        newHouse: endNewHouse
                    };
                    
                    results.push(row);
                }

                // 3. Hiển thị kết quả lên bảng
                cashFlowBody.innerHTML = ''; // Xóa bảng cũ
                results.forEach(row => {
                    const tr = document.createElement('tr');
                    tr.className = 'whitespace-nowrap even:bg-slate-50 hover:bg-gray-50';
                    
                    let surplusClass = row.surplus >= 0 ? 'text-green-600' : 'text-red-600';
                    if (row.endSavings < 0 || row.endAssets < 0) {
                        tr.className += ' bg-red-100';
                    } else if (row.endSavings < 1000) { // Cảnh báo STK dưới 1 tỷ
                         tr.className += ' bg-yellow-50';
                    }

                    tr.innerHTML = `
                        <td class="px-3 py-2 text-sm font-medium text-slate-900">${row.year}</td>
                        <td class="px-3 py-2 text-sm text-slate-700 font-medium">${formatCurrency(row.startAssets)}</td>
                        <td class="px-3 py-2 text-sm text-slate-500">${formatCurrency(row.startSavings)}</td>
                        <td class="px-3 py-2 text-sm text-slate-500">${formatCurrency(row.startStocks)}</td>
                        <td class="px-3 py-2 text-sm text-orange-600">${formatCurrency(row.annualExpense)}</td>
                        <td class="px-3 py-2 text-sm text-green-600">${formatCurrency(row.savingsInterest)}</td>
                        <td class="px-3 py-2 text-sm text-green-600">${formatCurrency(row.stocksInterest)}</td>
                        <td class="px-3 py-2 text-sm text-blue-600">${formatCurrency(row.nonInterestIncome)}</td>
                        <td class="px-3 py-2 text-sm font-medium ${surplusClass}">${formatCurrency(row.surplus)}</td>
                        <td class="px-3 py-2 text-sm text-slate-500 font-medium">${formatCurrency(row.endSavings)}</td>
                        <td class="px-3 py-2 text-sm text-slate-500 font-medium">${formatCurrency(row.endStocks)}</td>
                        <td class="px-3 py-2 text-sm text-slate-900 font-bold">${formatCurrency(row.endAssets)}</td>
                        <td class="px-3 py-2 text-sm text-slate-500 whitespace-normal min-w-[250px]">${row.notes.join('; ')}</td>
                    `;
                    cashFlowBody.appendChild(tr);
                });

                // 4. Chạy phân tích
                runAnalysis(results, inputs);
            }

            // --- HÀM PHÂN TÍCH KẾT QUẢ ---
            function runAnalysis(results, inputs) {
                let html = '';

                // Biểu tượng
                const iconDanger = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>`;
                const iconWarning = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-yellow-500" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM10 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>`;
                const iconSuccess = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>`;
                const iconIdea = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM3 8a1 1 0 100 2h1a1 1 0 100-2H3zM15 8a1 1 0 100 2h1a1 1 0 100-2h-1zM8 15a1 1 0 102 0v-1a1 1 0 10-2 0v1z" fill-rule="evenodd" clip-rule="evenodd"></path><path d="M12.937 11.625A4.002 4.002 0 0113 10a3.987 3.987 0 01-1.063 2.625c-1.02.722-2.193 1.15-3.437 1.15-1.244 0-2.417-.428-3.437-1.15A3.987 3.987 0 015 10c0-.06 0-.119.006-.179C6.545 12.016 8.163 12.5 10 12.5c1.837 0 3.455-.484 4.994-2.354.002.062.006.12.006.18z" fill-rule="evenodd" clip-rule="evenodd"></path><path fill-rule="evenodd" d="M11.5 5.5a1 1 0 10-2 0V7a1 1 0 102 0V5.5zM4 10a1 1 0 100 2h1a1 1 0 100-2H4zM15 10a1 1 0 100 2h1a1 1 0 100-2h-1zM9 16.5a1 1 0 102 0V15a1 1 0 10-2 0v1.5z" clip-rule="evenodd"></path></svg>`;

                
                // --- 1. Phân tích Tài sản âm ---
                const firstNegativeAssetYear = results.find(r => r.endAssets < 0);
                if (firstNegativeAssetYear) {
                    html += `<h3>${iconDanger}Tình trạng Tài sản (Tài sản ròng)</h3>`;
                    html += `<p>Theo dự báo, tổng tài sản ròng của gia đình bắt đầu <span class="highlight-bad">bị âm vào năm ${firstNegativeAssetYear.year}</span> (Giá trị cuối năm: ${formatCurrency(firstNegativeAssetYear.endAssets)} Triệu). Đây là một cột mốc rủi ro lớn cần phải điều chỉnh.</p>`;
                } else {
                    html += `<h3>${iconSuccess}Tình trạng Tài sản (Tài sản ròng)</h3>`;
                    html += `<p>Xin chúc mừng! Kế hoạch tài chính của bạn rất tốt, tổng tài sản ròng <span class="highlight-good">duy trì dương trong suốt 40 năm</span>. Tài sản cuối kỳ (năm ${results[results.length - 1].year}) đạt khoảng <span class="highlight-good">${formatCurrency(results[results.length - 1].endAssets)} Triệu VNĐ</span>.</p>`;
                }

                // --- 2. Phân tích Dòng tiền chi tiết ---
                html += `<h3>${iconWarning}Phân tích Dòng tiền (Thặng dư)</h3>`;
                
                const negativeSurplusPeriods = [];
                let isNegative = false;
                let startYear = null;
                
                results.forEach(r => {
                    if (r.surplus < 0 && !isNegative) {
                        isNegative = true;
                        startYear = r.year;
                    } else if (r.surplus >= 0 && isNegative) {
                        isNegative = false;
                        negativeSurplusPeriods.push({ start: startYear, end: r.year - 1 });
                    }
                });

                if (isNegative) { // Kết thúc mà vẫn âm
                    negativeSurplusPeriods.push({ start: startYear, end: results[results.length - 1].year });
                }

                if (negativeSurplusPeriods.length > 0) {
                    html += `<p>Phải <span class="highlight-bad">rút Sổ Tiết Kiệm (STK) để bù chi tiêu</span> trong các khoảng thời gian sau (thặng dư âm):</p>
                            <ul>`;
                    
                    negativeSurplusPeriods.forEach(p => {
                        const firstNegativeSavings = results.find(r => r.year >= p.start && r.endSavings < 0);
                        let runOutStatus = "";
                        if (firstNegativeSavings) {
                             runOutStatus = ` (STK cạn kiệt/âm từ năm ${firstNegativeSavings.year})`;
                        } else {
                             runOutStatus = " (STK vẫn duy trì dương)";
                        }
                        
                        let reasonForReturn = "";
                        if (p.end < results[results.length - 1].year) {
                             const returnYear = p.end + 1;
                             const returnRow = results.find(r => r.year === returnYear);
                             const notes = returnRow.notes.join('; ').toLowerCase();
                             
                             if (notes.includes("rút STK bù chi tiêu") && returnRow.surplus >= 0) {
                                reasonForReturn = ` (Nguyên nhân: STK dư lớn từ các sự kiện bán tài sản trước đó giúp lãi STK đủ bù chi phí)`;
                             } else if (notes.includes("bđ tttđ") || notes.includes("bán đất")) {
                                reasonForReturn = ` (Nguyên nhân: Dòng tiền dương trở lại nhờ ${returnRow.notes.find(n => n.includes("TTTĐ") || n.includes("Bán đất"))})`;
                             }
                        }

                        html += `<li><strong>Năm ${p.start} đến ${p.end}</strong>${runOutStatus}${reasonForReturn}</li>`;
                    });

                    html += `</ul>`;
                } else {
                    html += `<p>Dòng tiền thặng dư <span class="highlight-good">luôn dương</span>. Gia đình không bao giờ phải rút STK để bù chi tiêu.</p>`;
                }

                // --- 3. Phân tích Sự kiện lớn ---
                html += `<h3>${iconIdea}Các Sự kiện chính ảnh hưởng</h3>`;
                html += `<ul>`;

                html += `<li><strong>Nghỉ hưu:</strong> Chồng nghỉ hưu năm ${inputs.husbandRetireYear}, Vợ nghỉ hưu năm ${inputs.wifeRetireYear}. Việc giảm thu nhập lương này là nguyên nhân chính khiến dòng tiền thặng dư bị âm (trước khi thu nhập thụ động phát huy tác dụng).</li>`;

                html += `<li><strong>Sự kiện 2027:</strong> Giao dịch mua full Lumi (rút ${formatCurrency(3700)} Triệu) là cú sốc lớn lên STK, nhưng được bù đắp bởi tiền hỗ trợ (${formatCurrency(500)} Triệu).</li>`;
                
                if (inputs.sellLand2Value > 0) {
                    html += `<li><strong>Bán đất (${inputs.sellLand2Year}):</strong> Với giá trị ${formatCurrency(inputs.sellLand2Value)} Triệu, đây là nguồn tiền quan trọng được bơm vào STK/CK, giúp kéo dài khả năng thanh khoản của STK.</li>`;
                }

                if (inputs.sellLumiYear > 0) {
                     const rentPeriod = inputs.rentEndYear - inputs.rentStartYear + 1;
                     html += `<li><strong>Chiến lược nhà ở (${inputs.sellLumiYear} - ${inputs.newHouseBuyYear}):</strong> Bán Lumi (${formatCurrency(inputs.sellLumiValue)} Triệu) đưa một lượng tiền mặt lớn vào STK. Gia đình thuê nhà trong ${rentPeriod} năm (tăng chi phí ${formatCurrency(inputs.monthlyRentExpense*12)}/năm) trước khi mua nhà mới (${formatCurrency(inputs.newHouseValue)} Triệu). Đây là giai đoạn chuyển tiếp rất quan trọng.</li>`;
                }


                // --- 4. Tư vấn ---
                html += `<h3>${iconIdea}Tư vấn Kế hoạch (Tránh Tài sản âm)</h3>`;
                if (firstNegativeAssetYear || negativeSurplusPeriods.length > 0) {
                    html += `<p>Kế hoạch hiện tại có thể không bền vững về dài hạn. Cần ưu tiên các hành động sau:</p>
                             <ul>
                                <li><strong>Tăng Đầu tư Sinh lời:</strong> Hiện tại, ${inputs.surplusToSavings*100}% thặng dư vào STK. Cân nhắc tăng <span class="highlight-good">tỷ lệ phân bổ thặng dư vào Chứng khoán</span> để tăng tốc độ tăng trưởng tài sản (từ ${inputs.stocksRate*100}%/năm) trước khi nghỉ hưu.</li>
                                <li><strong>Tối ưu hóa Thu nhập Thụ động:</strong> Cần kích hoạt sớm hơn hoặc tăng cường nguồn thu nhập thụ động (Nguồn 2, 3, 4) để bù đắp sự sụt giảm lớn từ lương.</li>
                                <li><strong>Bán tài sản sinh lời thấp sớm hơn:</strong> Nếu dòng tiền STK âm nặng, cân nhắc đẩy sớm thời điểm bán đất (năm ${inputs.sellLand2Year}) để bơm tiền mặt vào hệ thống tài chính sớm hơn.</li>
                             </ul>`;
                } else {
                    html += `<p>Kế hoạch của bạn đang đi đúng hướng. Để tối đa hóa tài sản cuối kỳ, bạn có thể cân nhắc tăng tỉ lệ đầu tư vào Chứng khoán, nhưng tổng thể kế hoạch đã rất vững chắc.</p>`;
                }


                analysisOutput.innerHTML = html;
            }

            // --- GẮN SỰ KIỆN VÀ CHẠY LẦN ĐẦU ---
            populateDropdowns();
            
            // Gắn sự kiện đồng bộ phần trăm
            const surplusSavings = document.getElementById('surplusToSavings');
            const surplusStocks = document.getElementById('surplusToStocks');
            surplusSavings.addEventListener('change', () => syncPercentage('surplusToSavings', 'surplusToStocks'));
            surplusStocks.addEventListener('change', () => syncPercentage('surplusToStocks', 'surplusToSavings'));
            
            const land1Savings = document.getElementById('sellLand1ToSavings');
            const land1Stocks = document.getElementById('sellLand1ToStocks');
            land1Savings.addEventListener('change', () => syncPercentage('sellLand1ToSavings', 'sellLand1ToStocks'));
            land1Stocks.addEventListener('change', () => syncPercentage('sellLand1ToStocks', 'sellLand1ToSavings'));

            const land2Savings = document.getElementById('sellLand2ToSavings');
            const land2Stocks = document.getElementById('sellLand2ToStocks');
            land2Savings.addEventListener('change', () => syncPercentage('sellLand2ToSavings', 'sellLand2ToStocks'));
            land2Stocks.addEventListener('change', () => syncPercentage('sellLand2ToStocks', 'sellLand2ToSavings'));


            calculateButton.addEventListener('click', calculateAndRender);
            
            // Chạy tính toán lần đầu khi tải trang
            calculateAndRender();

        });
    
