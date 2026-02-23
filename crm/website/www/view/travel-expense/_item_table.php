<?php

use yii\helpers\Html;
use yii\widgets\ActiveForm;
use yii\web\View; 
use app\models\TravelExpenseItem; 
use kartik\select2\Select2;
use yii\helpers\Url; 
use yii\base\DynamicModel; 
use app\libs\Constant; 

function formatDateOrHyphen($dateString, $storageFormat = 'Y-m-d', $displayFormat = 'd/m/Y') {
    if (empty($dateString)) {
        return '-';
    }

    $dateObject = \DateTime::createFromFormat($storageFormat, $dateString);

    if ($dateObject && $dateObject->format($storageFormat) === $dateString) {
        return $dateObject->format($displayFormat);
    }

    return '-';
}


$viewModelAttributes = [
    'total_amount', 
    'sub_total', 
    'total_net', 
    'remark1', 
    'remark2', 
    'total_amount_words',
];

$viewModel = new DynamicModel($viewModelAttributes);
$modelIsNewRecord = !isset($model) || (isset($model) && $model->isNewRecord);

$statusKey = $model->status ?? '';
$currentUserId = \Yii::$app->user->id ?? null;

$STATUS_DRAFT = \app\libs\Constant::STATUS_DRAFT;
$STATUS_REJECTED = \app\libs\Constant::STATUS_EXPENSE_REJECTED;
$isEditable = $modelIsNewRecord || (in_array($statusKey, [$STATUS_DRAFT, $STATUS_REJECTED]) && $currentUserId == ($model->created_by ?? null));

$fixedRemarkTextForDisplay = '
<div style="margin-top: 15px; font-size: 12px; line-height: 1.5; color: #000000;">
    <p style="font-weight: bold; margin-bottom: 5px;">หมายเหตุ Remark</p>
    <ol style="padding-left: 20px; margin-bottom: 0; list-style-type: decimal;">
        <li>กรุณาแนบรูปถ่ายเลขไมล์, Google map, ใบเสร็จค่าใช้จ่ายค่าน้ำมัน ค่าชาร์จไฟ ค่าไฟฟ้า ค่าใช้จ่ายอื่นๆ ในนามบริษัทฯ เพื่อเปรียบเทียบระหว่างยอดรวมใบเสร็จค่าน้ำมันกับค่าเดินทางตามระยะทาง โดยบริษัทฯจะจ่ายยอดที่น้อยกว่า ทั้งนี้ต้องเบิกภายในรอบเดือนเท่านั้น</li>
        <li>หากไม่สามารถออกใบเสร็จได้ กรุณาแนบรูปถ่ายหรือแสดงหลักฐาน พร้อมแนบใบรับรองแทนใบเสร็จด้วยทุกครั้ง</li>
        <li>การเบิกค่าใช้จ่าย ที่ไม่สอดคล้องกับระเบียบปฏิบัติหรือข้อเท็จจริง จะถูกพิจารณาโทษทางวินัย เลิกสัญญา จ้างโดยไม่จ่ายค่าชดเชยใดๆทั้งสิ้น</li>
    </ol>
</div>';

$fixedRemarkTextForDb = "1. กรุณาแนบรูปถ่ายเลขไมล์, Google map, ใบเสร็จค่าใช้จ่ายค่าน้ำมัน ค่าชาร์จไฟ ค่าไฟฟ้า ค่าใช้จ่ายอื่นๆ ในนามบริษัทฯ เพื่อเปรียบเทียบระหว่างยอดรวมใบเสร็จค่าน้ำมันกับค่าเดินทางตามระยะทาง โดยบริษัทฯจะจ่ายยอดที่น้อยกว่า ทั้งนี้ต้องเบิกภายในรอบเดือนเท่านั้น\n2. หากไม่สามารถออกใบเสร็จได้ กรุณาแนบรูปถ่ายหรือแสดงหลักฐาน พร้อมแนบใบรับรองแทนใบเสร็จด้วยทุกครั้ง\n3. การเบิกค่าใช้จ่าย ที่ไม่สอดคล้องกับระเบียบปฏิบัติหรือข้อเท็จจริง จะถูกพิจารณาโทษทางวินัย เลิกสัญญา จ้างโดยไม่จ่ายค่าชดเชยใดๆทั้งสิ้น";


if (!$modelIsNewRecord) {
    $viewModel->sub_total = $model->sub_total ?? 0.00;
    $viewModel->total_net = $model->total_net ?? 0.00;
    
    $viewModel->total_amount = $viewModel->sub_total;
    $viewModel->total_amount_words = ''; 
    
} else {
    $viewModel->total_amount = 0.00;
    $viewModel->sub_total = 0.00;
    $viewModel->total_net = 0.00;
    $viewModel->remark1 = '';
    $viewModel->remark2 = '';
    $viewModel->total_amount_words = 'ศูนย์บาทถ้วน'; 

    if (isset($model) && $model instanceof \yii\db\ActiveRecord) {
        $model->remark_long = $fixedRemarkTextForDb;
    }
}

if (!isset($modelsItem) || (is_array($modelsItem) && empty($modelsItem))) {
    $modelsItem = [new TravelExpenseItem()]; 
}

$todayDateStorage = date('Y-m-d');
$todayDateDisplay = date('d/m/Y');

$carTypeOptions = Constant::CAR_TYPES;

foreach ($modelsItem as $i => $modelItem) {
    if (empty($modelItem->item_date)) {
        $modelsItem[$i]->item_date = $todayDateStorage;
    }
    
    $other_items_price_val = $modelItem->other_items_price ?? 0.00;
    $travel_price_val = $modelItem->travel_price ?? 0.00;
    $distance_val = $modelItem->distance ?? 0;
    
    $base_amount_item = $other_items_price_val + $travel_price_val;

    $modelsItem[$i]->amount = $base_amount_item; 
}


?>

<style>
    .table > tbody > tr > td {
        padding: 0px 2px !important;
        vertical-align: middle !important;
    }
    .table > thead > tr > th {
        vertical-align: middle !important;
        text-align: center;
    }
    .form-control {
        margin: 5px 0;
    }
    #total-summary-section {
        margin-top: 15px;
        border-top: 1px solid #eee;
        padding-top: 10px;
    }
    .total-row {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        margin-bottom: 5px;
        font-weight: bold;
    }
    .total-row .total-label {
        margin-right: 15px;
        width: 280px;
        text-align: right;
    }
    .total-row .total-value-box {
        width: 150px;
    }
    .total-row .form-control {
        margin: 0;
    }
    .rate-input {
        width: 80px; 
        display: inline-block;
    }
    .cell-center {
        text-align: center !important;
    }

    .table-responsive-horizontal {
        overflow-x: auto;
    }

    #expense-items-table {
        table-layout: fixed; 
        min-width: 2000px; 
        width: 100%;
    }
    
    .select2-container--krajee .select2-selection--single {
        display: flex !important; 
        align-items: center; 
        position: relative !important; 
        border-radius: 4px !important; 
    }

    .select2-container--krajee .select2-selection__rendered {
        flex-grow: 1 !important; 
        order: 1 !important; 
        padding: 0px 0px 0px 12px !important;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .select2-container--krajee .select2-selection__clear {
        order: 2 !important; 
        position: static !important; 
        left: 8px !important; 
        top: 50% !important; 
        transform: none !important; 
        font-size: 1.4rem !important; 
        font-weight: bold !important; 
        line-height: 1 !important; 
        margin: 0 5px !important; 
        padding: 0 !important;
        z-index: 10 !important;
    }
    
    .select2-container--krajee .select2-selection__arrow {
        order: 3 !important; 
        position: static !important; 
        height: 100% !important; 
        width: 0px !important; 
        display: none !important; 
    }
    
    .select2-container--krajee .select2-selection__arrow b {
        display: none !important;
    }

    .select2-container--krajee .select2-selection__arrow:after {
        content: none !important; 
    }

    .select2-container .select2-selection__clear {
    float: right !important;

    }

    .select2-container--bootstrap .select2-selection--single {
    padding: 6px 24px 6px 8px !important;
    height: 38px !important;
    }

    #expense-items-table thead th {
        border: 1px solid #ddd !important; 
        background-color: #fcfcfc;
        color: #333;
    }

    #expense-items-table, 
    #expense-items-table th, 
    #expense-items-table td {
        border: 1px solid #ddd !important;
    }

    .select2-container--krajee .select2-results__options,
    .select2-container--bootstrap .select2-results__options {
        max-height: 250px !important;
        overflow-y: auto !important;
    }

    .select2-results__options::-webkit-scrollbar {
        width: 8px;
    }
    .select2-results__options::-webkit-scrollbar-track {
        background: #f1f1f1;
    }
    .select2-results__options::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 4px;
    }
    .select2-results__options::-webkit-scrollbar-thumb:hover {
        background: #555;
    }
    
</style>

<div class="expense-details-section">
    <div class="panel panel-default mt-3">
        <div class="panel-body">
            <div class="table-responsive-horizontal">
                <table class="table table-bordered table-striped" id="expense-items-table">
                <thead>
                    <tr>
                        <th rowspan="2" style="width: 50px;"></th> 
                        <th rowspan="2" style="width: 50px;">#</th>
                        <th rowspan="2" style="width: 110px;">วันที่เดินทาง</th> 
                        <th rowspan="2" style="width: 250px;">โครงการ</th> 
                        <th rowspan="2" style="width: 200px;">การปฏิบัติงาน</th> 
                        <th rowspan="2" style="width: 100px;">จุดเริ่มต้น</th>
                        <th rowspan="2" style="width: 100px;">จุดสิ้นสุด</th> 
                        <th colspan="2" class="cell-center" style="border-bottom: 1px solid #ddd !important;">รายการอื่นๆ</th>
                        <th colspan="5" class="cell-center" style="border-bottom: 1px solid #ddd !important;">ประเภทรถส่วนตัว: รถยนต์ A, รถยนต์ไฟฟ้า B, รถจักรยานยนต์ C</th>
                        <th rowspan="2" style="width: 170px;">ยอดรวม</th>
                    </tr>
                    <tr>
                        <th style="width: 100px; border-left: 1px solid #ddd !important;">รายการ</th>
                        <th style="width: 120px;">บาท</th>
                        <th style="width: 180px; border-left: 1px solid #ddd !important;">ประเภท</th>
                        <th style="width: 120px;">เลขไมล์เริ่มต้น</th>
                        <th style="width: 120px;">เลขไมล์สิ้นสุด</th>
                        <th style="width: 120px;">ระยะทาง (กม.)</th>
                        <th style="width: 120px;">บาท</th>
                        <th style="width: 0px; display:none; border:none;"></th>
                    </tr>
                </thead>
                    <tbody class="container-items dynamic-list-wrapper">
                        <?php foreach ($modelsItem as $i => $modelItem):
                            $base_amount_item = $modelItem->amount ?? 0.00;
                            
                            $other_items_price_val = $modelItem->other_items_price ?? 0.00;
                            $travel_price_val = $modelItem->travel_price ?? 0.00;
                            $starting_mileage_val = (int)($modelItem->starting_mileage ?? 0);
                            $end_mileage_val = (int)($modelItem->end_mileage ?? 0);
                            $distance_val = (int)($modelItem->distance ?? 0);
                        ?>
                        <tr class="item">
                            <td class="cell-center">
                                <?php if ($isEditable): ?>
                                    <button type="button" class="remove-item-row btn btn-danger btn-xs" style="width: 30px; height: 25px; margin: auto; display: flex; align-items: center; justify-content: center;">
                                        <i class="mdi mdi-minus"></i>
                                    </button>
                                <?php endif; ?>
                            </td>
                            <td class="index-cell cell-center">
                                <?= ($i + 1) ?>
                            </td>
                            <td>
                                <?php
                                    $displayDate = formatDateOrHyphen($modelItem->item_date);
                                ?>
                                <?= Html::textInput("TravelExpenseItem[$i][item_date]", $displayDate, [
                                    'class' => 'form-control date-picker-field item-date', 
                                    'placeholder' => 'วัน/เดือน/ปี',
                                    'id' => "travelexpenseitem-{$i}-item_date",
                                    'disabled' => !$isEditable,
                                ]) ?>
                            </td>
                            <td>
                                <?= Select2::widget([
                                    'name' => "TravelExpenseItem[$i][project_id]",
                                    'value' => $modelItem->project_id,
                                    'data' => $projects ?? [],
                                    'options' => [
                                        'class' => 'form-control item-project-select',
                                        'placeholder' => 'ค้นหารหัสหรือชื่อโครงการ...',
                                        'id' => "travelexpenseitem-{$i}-project_id",
                                        'disabled' => !$isEditable,
                                    ],
                                    'pluginOptions' => [
                                        'allowClear' => true,
                                        'theme' => "bootstrap",
                                        'width' => '100%',
                                    ],
                                ]) ?>
                            </td>
                            <td>
                                <?= Html::textarea("TravelExpenseItem[$i][description]", $modelItem->description, [
                                    'rows' => 1, 
                                    'style' => 'resize: none;',
                                    'class' => 'form-control',
                                    'id' => "travelexpenseitem-{$i}-description",
                                    'disabled' => !$isEditable,
                                ]) ?>
                            </td>
                            <td>
                                <?= Html::textInput("TravelExpenseItem[$i][travel_start]", $modelItem->travel_start, [
                                    'class' => 'form-control item-travel-start', 
                                    'id' => "travelexpenseitem-{$i}-travel_start",
                                    'disabled' => !$isEditable,
                                ]) ?>
                            </td>
                            <td>
                                <?= Html::textInput("TravelExpenseItem[$i][travel_end]", $modelItem->travel_end, [
                                    'class' => 'form-control item-travel-end', 
                                    'id' => "travelexpenseitem-{$i}-travel_end",
                                    'disabled' => !$isEditable,
                                ]) ?>
                            </td>
                            <td class="cell-center">
                                <?= Html::textInput("TravelExpenseItem[$i][other_items]", $modelItem->other_items, [
                                    'class' => 'form-control item-other-items', 
                                    'id' => "travelexpenseitem-{$i}-other_items",
                                    'disabled' => !$isEditable,
                                ]) ?>
                            </td>
                            <td>
                                <?= Html::textInput("TravelExpenseItem[$i][other_items_price]", number_format($other_items_price_val, 2, '.', ''), [
                                    'type' => 'number',
                                    'step' => '0.01',
                                    'min' => 0, 
                                    'class' => 'form-control item-other-price text-right', 
                                    'id' => "travelexpenseitem-{$i}-other_items_price",
                                    'disabled' => !$isEditable,
                                ]) ?>
                                
                                <?= Html::hiddenInput("TravelExpenseItem[$i][amount]", $base_amount_item, [ 
                                    'class' => 'item-amount-hidden',
                                    'id' => "travelexpenseitem-{$i}-amount",
                                    'disabled' => !$isEditable,
                                ]) ?>
                            </td>
                            <td class="cell-center">
                                <?= Select2::widget([
                                    'name' => "TravelExpenseItem[$i][car_type]",
                                    'value' => $modelItem->car_type,
                                    'data' => $carTypeOptions, 
                                    'options' => [
                                        'class' => 'form-control item-car-type-select', 
                                        'placeholder' => '--- เลือกประเภทรถ ---',
                                        'id' => "travelexpenseitem-{$i}-car_type",
                                        'allowClear' => false, 
                                        'disabled' => !$isEditable,
                                    ],
                                    'pluginOptions' => [
                                        'theme' => "bootstrap",
                                        'width' => '100%',
                                        'allowClear' => false, 
                                        'minimumResultsForSearch' => 'Infinity' 
                                    ],
                                ]) ?>
                            </td>
                            <td>
                                <?= Html::textInput("TravelExpenseItem[$i][starting_mileage]", $starting_mileage_val, [
                                    'type' => 'number',
                                    'min' => '0',
                                    'class' => 'form-control item-starting-mileage text-right', 
                                    'id' => "travelexpenseitem-{$i}-starting_mileage",
                                    'disabled' => !$isEditable,
                                ]) ?>
                            </td>
                            <td>
                                <?= Html::textInput("TravelExpenseItem[$i][end_mileage]", $end_mileage_val, [
                                    'type' => 'number',
                                    'min' => '0',
                                    'class' => 'form-control item-end-mileage text-right', 
                                    'id' => "travelexpenseitem-{$i}-end_mileage",
                                    'disabled' => !$isEditable,
                                ]) ?>
                            </td>
                            <td>
                                <?= Html::textInput("TravelExpenseItem[$i][distance]", number_format($distance_val, 2, '.', ''), [
                                    'type' => 'number',
                                    'step' => '0.01',
                                    'min' => '0',
                                    'class' => 'form-control item-distance text-right', 
                                    'id' => "travelexpenseitem-{$i}-distance",
                                    'readonly' => true, 
                                ]) ?>
                            </td>
                            <td>
                                <?= Html::textInput("TravelExpenseItem[$i][travel_price]", number_format($travel_price_val, 2, '.', ''), [
                                    'type' => 'number',
                                    'step' => '0.01',
                                    'min' => '0',
                                    'class' => 'form-control item-travel-price text-right', 
                                    'id' => "travelexpenseitem-{$i}-travel_price",
                                    'readonly' => true,
                                ]) ?>
                            </td>
                            <td>
                                <?= Html::textInput('total_amount_view', number_format($base_amount_item, 2), [
                                    'class' => 'form-control item-total-amount-view text-right', 
                                    'readonly' => true,
                                    'id' => 'total-amount-view-' . $i 
                                ]) ?>
                                
                                <?= Html::hiddenInput("TravelExpenseItem[$i][unit_price]", 0, [ 
                                    'class' => 'item-price text-right'
                                ]) ?>
                                <?= Html::hiddenInput("TravelExpenseItem[$i][quantity]", 0, [ 
                                    'class' => 'item-qty text-right'
                                ]) ?>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>

            <div class="row" style="margin-top: 5px;">
                <div class="col-md-6">
                <?php if ($isEditable): ?>
                    <button 
                        type="button" 
                        id="add-item-bottom" 
                        class="btn btn-sm"
                        style="background-color: #58db83; border-color: #58db83; color: white;">
                        <i class="mdi mdi-plus"></i> เพิ่มรายการ
                    </button>
                <?php endif; ?>

                    <?= $fixedRemarkTextForDisplay ?>
                    
                    <div class="form-group" style="display: none;">
                        <label class="control-label" for="expenserequest-remark_long_final">รวมหมายเหตุสำหรับ DB:</label>
                        <?= Html::textarea('Expense[remark_long]', $model->remark_long ?? '', [
                            'rows' => 1, 
                            'class' => 'form-control',
                            'id' => 'expenserequest-remark_long_final'
                        ]) ?>
                        <?= Html::hiddenInput('Expense[remark1]', $model->remark1 ?? '', ['id' => 'expenserequest-remark1']) ?>
                        <?= Html::hiddenInput('Expense[remark2]', $model->remark2 ?? '', ['id' => 'expenserequest-remark2']) ?>
                    </div>
                </div>
                <div class="col-md-6">
                    <div id="total-summary-section" style="border-top: none; margin-top: 20px;">
                        <div class="total-row" style="margin-bottom: 10px;">
                            <span class="total-label">รวมใบเสร็จค่าน้ำมัน,ค่าไฟฟ้า (ระบุ) (THB):</span>
                            <div class="total-value-box">
                            <input type="number" id="summary-fuel-input" 
                                name="TravelExpense[total_receipt_amount]" 
                                class="form-control text-right" 
                                value="<?= $model->total_receipt_amount ?? 0.00 ?>" 
                                step="0.01" 
                                style="font-size: 14px;"
                                <?= !$isEditable ? 'readonly' : '' ?>>
                            </div>
                        </div>

                        <div class="total-row" style="margin-bottom: 10px;">
                        <span class="total-label">รวมค่าเดินทางตามระยะทาง (THB):</span>
                        <div class="total-value-box">
                            <input type="text" id="summary-travel-distance-view" class="form-control text-right" readonly 
                                value="<?= number_format($model->total_mileage_expense ?? 0, 2, '.', '') ?>" style="font-size: 14px;">
                            <?= Html::hiddenInput('TravelExpense[total_mileage_expense]', $model->total_mileage_expense ?? 0.00, ['id' => 'total_mileage_hidden']) ?>
                        </div>
                    </div>

                    <div class="total-row" style="margin-bottom: 13px;">
                        <span class="total-label">รวมค่าใช้จ่ายอื่นๆ (THB):</span>
                        <div class="total-value-box">
                            <input type="text" id="summary-other-misc-view" class="form-control text-right" readonly 
                                value="<?= number_format($model->total_other_expense ?? 0, 2, '.', '') ?>" style="font-size: 14px;">
                            <?= Html::hiddenInput('TravelExpense[total_other_expense]', $model->total_other_expense ?? 0.00, ['id' => 'total_other_hidden']) ?>
                        </div>
                    </div>

                        <div class="total-row">
                            <span class="total-label">รวมค่าใช้จ่ายทั้งหมด (THB):</span>
                            <div class="total-value-box">
                                <input type="text" id="expenserequest-total_net_view" 
                                    class="form-control text-right" readonly 
                                    style="background-color: #f0f8ff; font-size: 14px;"
                                    value="<?= number_format($model->total_grand ?? 0, 2) ?>">
                                <?= Html::hiddenInput('TravelExpense[total_grand]', $model->total_grand ?? 0.00, ['id' => 'expenserequest-total_net']) ?>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>


    <template id="expense-item-template">
        <tr class="item">
            <td class="cell-center">
                <button type="button" class="remove-item-row btn btn-danger btn-xs" style="width: 30px; height: 25px; margin: auto; display: flex; align-items: center; justify-content: center;">
                    <i class="mdi mdi-minus"></i>
                </button>
            </td>
            <td class="index-cell cell-center">#</td>
            <td>
                <?= Html::textInput('TravelExpenseItem[__index__][item_date]', $todayDateDisplay, [
                    'class' => 'form-control date-picker-field item-date', 
                    'placeholder' => 'วัน/เดือน/ปี',
                    'id' => "travelexpenseitem-__index__-item_date"
                ]) ?>
            </td>
            <td>
                <select 
                    name="TravelExpenseItem[__index__][project_id]"
                    id="travelexpenseitem-__index__-project_id"
                    class="form-control item-project-select"
                    data-placeholder="ค้นหารหัสหรือชื่อโครงการ..."
                    style="width: 100%;">
                    <option value=""></option>
                    <?php 
                        if (isset($projects) && is_array($projects)) {
                            foreach ($projects as $code => $name) {
                                $safeName = Html::encode($name); 
                                $safeCode = Html::encode($code);
                                echo "<option value=\"{$safeCode}\">{$safeName}</option>";
                            }
                        }
                    ?>
                </select>
            </td>
            <td>
                <?= Html::textarea('TravelExpenseItem[__index__][description]', '', [
                    'rows' => 1, 
                    'style' => 'resize: none;',
                    'class' => 'form-control',
                    'id' => "travelexpenseitem-__index__-description"
                ]) ?>
            </td>
            <td>
                <?= Html::textInput('TravelExpenseItem[__index__][travel_start]', '', [
                    'class' => 'form-control item-travel-start', 
                    'id' => "travelexpenseitem-__index__-travel_start"
                ]) ?>
            </td>
            <td>
                <?= Html::textInput('TravelExpenseItem[__index__][travel_end]', '', [
                    'class' => 'form-control item-travel-end', 
                    'id' => "travelexpenseitem-__index__-travel_end"
                ]) ?>
            </td>
            <td class="cell-center">
                <?= Html::textInput('TravelExpenseItem[__index__][other_items]', '', [
                    'class' => 'form-control item-other-items', 
                    'id' => "travelexpenseitem-__index__-other_items"
                ]) ?>
            </td>
            <td>
                <?= Html::textInput('TravelExpenseItem[__index__][other_items_price]', '0.00', [
                    'type' => 'number',
                    'step' => '0.01',
                    'min' => 0,
                    'class' => 'form-control item-other-price text-right', 
                    'id' => "travelexpenseitem-__index__-other_items_price",
                ]) ?>
                <?= Html::hiddenInput('TravelExpenseItem[__index__][amount]', 0, [ 
                    'class' => 'item-amount-hidden',
                    'id' => "travelexpenseitem-__index__-amount"
                ]) ?>
            </td>
            <td class="cell-center">
                <select 
                    name="TravelExpenseItem[__index__][car_type]"
                    id="travelexpenseitem-__index__-car_type"
                    class="form-control item-car-type-select" 
                    data-placeholder="--- เลือกประเภทรถ ---"
                    style="width: 100%;">
                    <option value=""></option>
                    <?php 
                        if (isset($carTypeOptions) && is_array($carTypeOptions)) {
                            foreach ($carTypeOptions as $code => $name) {
                                $safeName = Html::encode($name); 
                                $safeCode = Html::encode($code);
                                echo "<option value=\"{$safeCode}\">{$safeName}</option>";
                            }
                        }
                    ?>
                </select>
            </td>
            <td>
                <?= Html::textInput('TravelExpenseItem[__index__][starting_mileage]', 0, [ 
                    'type' => 'number',
                    'min' => '0',
                    'class' => 'form-control item-starting-mileage text-right', 
                    'id' => "travelexpenseitem-__index__-starting_mileage"
                ]) ?>
            </td>
            <td>
                <?= Html::textInput('TravelExpenseItem[__index__][end_mileage]', 0, [ 
                    'type' => 'number',
                    'min' => '0',
                    'class' => 'form-control item-end-mileage text-right', 
                    'id' => "travelexpenseitem-__index__-end_mileage"
                ]) ?>
            </td>
            <td>
                <?= Html::textInput('TravelExpenseItem[__index__][distance]', '0.00', [ 
                    'type' => 'number',
                    'step' => '0.01',
                    'min' => '0',
                    'class' => 'form-control item-distance text-right', 
                    'id' => "travelexpenseitem-__index__-distance",
                    'readonly' => true, 
                ]) ?>
            </td>
            <td>
                <?= Html::textInput('TravelExpenseItem[__index__][travel_price]', '0.00', [ 
                    'type' => 'number',
                    'step' => '0.01',
                    'min' => '0',
                    'class' => 'form-control item-travel-price text-right', 
                    'id' => "travelexpenseitem-__index__-travel_price",
                    'readonly' => true,
                ]) ?>
            </td>
            <td>
                <?= Html::textInput('total_amount_view', '0.00', [
                    'class' => 'form-control item-total-amount-view text-right', 
                    'readonly' => true,
                    'id' => 'total-amount-view-__index__'
                ]) ?>
                
                <?= Html::hiddenInput('TravelExpenseItem[__index__][unit_price]', 0, [ 
                    'class' => 'item-price text-right'
                ]) ?>
                <?= Html::hiddenInput('TravelExpenseItem[__index__][quantity]', 0, [ 
                    'class' => 'item-qty text-right'
                ]) ?>
            </td>
        </tr>
    </template>

</div>

<?php 

$fixedRemarkTextDbJs = json_encode($fixedRemarkTextForDb);

$js = <<<JS
function initClonedProjectSelect(element) {
    if (!element.data('select2')) {
        element.select2({
            allowClear: true,
            theme: "bootstrap",
            width: '100%',
            placeholder: element.attr('data-placeholder') || 'ค้นหารหัสหรือชื่อโครงการ...'
        });
        element.next('.select2-container').addClass('select2-container--krajee');
    }
}

function initCarTypeSelect(element) {
    if (!element.data('select2')) {
        element.select2({
            allowClear: false, 
            theme: "bootstrap",
            width: '100%',
            placeholder: element.attr('data-placeholder') || '--- เลือกประเภทรถ ---',
            minimumResultsForSearch: 'Infinity' 
        });
        element.next('.select2-container').addClass('select2-container--krajee');
    }
}

function updateCombinedRemark() {
    var remark1 = jQuery('#expenserequest-remark1').val() || '';
    var remark2 = jQuery('#expenserequest-remark2').val() || '';
    var fixedRemarkTextForDb = {$fixedRemarkTextDbJs}; 
    var fixedRemark = jQuery.trim(\$('<div/>').html(fixedRemarkTextForDb).text());

    var combined = [];
    if (remark1.trim().length > 0) combined.push(remark1.trim());
    if (remark2.trim().length > 0) combined.push(remark2.trim());
    
    var finalRemark = combined.join('\\n') + (combined.length > 0 && fixedRemark.length > 0 ? '\\n\\n' : '') + fixedRemark;

    jQuery('#expenserequest-remark_long_final').val(finalRemark.trim());
}

function recalculateTotals() {
    var fuelInputVal = parseFloat(jQuery('#summary-fuel-input').val()) || 0;
    var totalTravelPrice = 0.00;
    var totalOtherMisc = 0.00;
    
    jQuery('.container-items').find('.item').each(function() {
        var row = jQuery(this);
        if (row.css('display') !== 'none') {
            var otherPrice = parseFloat(row.find('.item-other-price').val()) || 0;
            var travelPrice = parseFloat(row.find('.item-travel-price').val()) || 0;
            
            totalOtherMisc += otherPrice;
            totalTravelPrice += travelPrice;
            
            var rowTotal = otherPrice + travelPrice;
            row.find('.item-total-amount-view').val(rowTotal.toFixed(2));
            row.find('.item-amount-hidden').val(rowTotal.toFixed(2));
        }
    });

    var totalAll = totalTravelPrice + totalOtherMisc;

    jQuery('#summary-travel-distance-view').val(totalTravelPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}));
    jQuery('#summary-other-misc-view').val(totalOtherMisc.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}));
    jQuery('#expenserequest-total_net_view').val(totalAll.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}));

    jQuery('#total_mileage_hidden').val(totalTravelPrice.toFixed(2));
    jQuery('#total_other_hidden').val(totalOtherMisc.toFixed(2));
    jQuery('#expenserequest-total_net').val(totalAll.toFixed(2));
    
    if (typeof updateCombinedRemark === "function") {
        updateCombinedRemark();
    }
}

jQuery(document).on('change keyup', '#summary-fuel-input', function() {
    recalculateTotals();
});

function updateRowIndexes() {
    jQuery('.container-items').find('.item').each(function(i) {
        var row = jQuery(this);
        row.find('.index-cell').text(i + 1);
        
        var index = i;
        row.find('input, select, textarea').each(function() {
            var oldName = jQuery(this).attr('name');
            var oldId = jQuery(this).attr('id');

            if (oldName) {
                var newName = oldName.replace(/TravelExpenseItem\[\d*\]/g, 'TravelExpenseItem[' + index + ']');
                jQuery(this).attr('name', newName);
            }
            if (oldId) {
                var newId = oldId.replace(/travelexpenseitem-\d*-/g, 'travelexpenseitem-' + index + '-');
                jQuery(this).attr('id', newId);
            }
        });

        row.find('.item-total-amount-view').attr('id', 'total-amount-view-' + index);
    });
}

function addNewItem() {
    var template = jQuery('#expense-item-template').html();
    var container = jQuery('.container-items');
    var index = container.find('.item').length;
    
    var newRow = template.replace(/__index__/g, index);
    container.append(newRow);
    
    var newRowElement = container.find('.item:last');
    
    newRowElement.find('.date-picker-field').datepicker({
        format: 'dd/mm/yyyy',
        autoclose: true,
        changeMonth: true,
        changeYear: true,
        language: 'th',
        orientation: "bottom"
    });
    
    initClonedProjectSelect(newRowElement.find('.item-project-select'));
    initCarTypeSelect(newRowElement.find('.item-car-type-select'));

    updateRowIndexes();
    recalculateTotals();
    
    newRowElement.find('.item-starting-mileage, .item-end-mileage').trigger('change');
}


jQuery(document).ready(function() {
    
    jQuery('.date-picker-field').datepicker({
        format: 'dd/mm/yyyy',
        autoclose: true,
        changeMonth: true,
        changeYear: true,
        language: 'th',
        orientation: "bottom"
    });
    
    jQuery('.item-project-select').each(function() {
        initClonedProjectSelect(jQuery(this));
    });

    jQuery('.item-car-type-select').each(function() {
        initCarTypeSelect(jQuery(this));
    });

    jQuery(document).on('change keyup', '.item-starting-mileage, .item-end-mileage, .item-other-price, .item-car-type-select', function() {
        var row = jQuery(this).closest('.item');
        var start = parseFloat(row.find('.item-starting-mileage').val()) || 0;
        var end = parseFloat(row.find('.item-end-mileage').val()) || 0;
        var otherPrice = parseFloat(row.find('.item-other-price').val()) || 0;
        
        var distance = 0;
        if (end >= start) {
            distance = end - start;
            row.find('.item-distance').val(distance.toFixed(2));
        } else {
            row.find('.item-distance').val(0.00); 
        }

        var carType = row.find('.item-car-type-select').val(); 
        var travelPrice = 0;

        if (carType === 'A') {
            travelPrice = distance * 5;
        } else if (carType === 'B' || carType === 'C') {
            travelPrice = distance * 2;
        }
        
        row.find('.item-travel-price').val(travelPrice.toFixed(2));
        
        var baseAmount = otherPrice + travelPrice;
        
        row.find('.item-amount-hidden').val(baseAmount.toFixed(2));
        row.find('.item-total-amount-view').val(baseAmount.toFixed(2));
        
        recalculateTotals(); 
    }).trigger('change');

    jQuery('#add-item-bottom').on('click', function() {
        addNewItem();
    });

    jQuery(document).on('click', '.remove-item-row', function() {
        jQuery(this).closest('.item').remove();
        updateRowIndexes();
        recalculateTotals();
    });

    updateCombinedRemark();
});
JS;
$this->registerJs($js, \yii\web\View::POS_READY);
?>