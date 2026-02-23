<?php
use app\components\MyComponent;
use app\libs\Constant;
use app\components\ReadPrice;

$mpdf = isset($mpdf) ? $mpdf : null;
if (!function_exists('renderCheckboxImg')) {
    function renderCheckboxImg($value, $expected) {
        $img = ($value == $expected) ? 'checked.png' : 'unchecked.png';
        return '<img src="' . Yii::getAlias('@webroot/images/icon/' . $img) . '" width="10" style="vertical-align:middle; margin-right:2px;">';
    }
}

function renderPdfMultiline($mpdf, $text, $widthMm, $font='thsarabun', $fontSize=9)
{
    if (!$text || !$mpdf) return $text;
    $text = trim(strip_tags($text));
    $result = Yii::$app->forms->splitTextByWidth($mpdf, $text, $widthMm, $font, $fontSize);
    return !empty($result['lines']) ? implode('<br>', $result['lines']) : $text;
}

$contentHeight = 90; 
$avgRowHeight = 9;
?>

<table class="table-expense" style="width:100%; border-collapse:collapse; table-layout:fixed; margin:0; font-size: 8pt; line-height: 1.0;" cellpadding="0" cellspacing="0">
    <tr>
        <td style="width:30mm; height:6.5mm; padding-left: 5px; vertical-align: middle;"><strong>ผู้ขอให้ดำเนินการ <br>Requestor</strong></td>
        <td style="width:60mm; height:6.5mm; border-right:none; padding-left: 5px; vertical-align: middle;" class="tb-txt-body"><?= $model->requestor->first_name ?> <?= $model->requestor->last_name ?></td>
        <td style="width:30mm; height:6.5mm; padding-left: 5px; vertical-align: middle;"><strong>แผนก Department</strong></td>
        <td style="width:40mm; height:6.5mm; padding-left: 5px; vertical-align: middle;" colspan="3" class="tb-txt-body"><?= $model->department->name ?></td>
        <td style="width:30mm; height:6.5mm; padding-left: 5px; vertical-align: middle;"><strong>วันที่เอกสาร Date</strong></td>
        <td style="width:35mm; height:6.5mm; padding-left: 5px; vertical-align: middle;" colspan="2" class="tb-txt-body">
            <?= (!empty($model->request_date) && $model->request_date !== '0000-00-00') ? date('d/M/Y', strtotime($model->request_date)) : '' ?>
        </td>
    </tr>
    <tr>
        <td style="width:30mm; height:6.5mm; padding-left: 5px; vertical-align: middle;"><strong>จ่ายให้ Pay to</strong></td>
        <td style="width:60mm; height:6.5mm; border-right:none; padding-left: 5px; vertical-align: middle;" class="tb-txt-body"><?= $model->employee->first_name ?> <?= $model->employee->last_name ?></td>
        <td style="width:30mm; height:6.5mm; padding-left: 5px; vertical-align: middle;"><strong>วัตถุประสงค์การเบิก <br>Purpose</strong></td>
        <td style="width:40mm; height:6.5mm; padding-left: 5px; vertical-align: middle;" colspan="3" class="tb-txt-body"><?= $setText['purpose'] ?></td>
        <td style="width:30mm; height:6.5mm; padding-left: 5px; vertical-align: middle;"><strong>หมายเหตุ Remark</strong></td>
        <td style="width:35mm; height:6.5mm; padding-left: 5px; vertical-align: middle;" colspan="2" class="tb-txt-body"><?= $setText['remark_short'] ?></td>
    </tr>
</table>

<table class="table-expense table-no-top-border" style="width:100%; border-collapse:collapse; table-layout:fixed; margin:0; margin-top: -1px; font-size: 8pt; line-height: 1.0;" cellpadding="0" cellspacing="0">
    <tr>
        <td rowspan="2" style="width:30mm; height:13mm; vertical-align: middle; padding-left: 5px;"><strong>วิธีการรับเงิน<br>Payment Method</strong></td>
        <td style="width:6mm; height:6.5mm; text-align:center; vertical-align:middle;"><?= renderCheckboxImg($model->payment_method, 'cash') ?></td>
        <td style="width:24mm; height:6.5mm; vertical-align:middle; text-align: left;"><strong>เงินสด/Cash</strong></td>
        <td style="width:6mm; height:6.5mm; text-align:center; vertical-align:middle;"><?= renderCheckboxImg($model->payment_method, 'bank_transfer') ?></td>
        <td style="width:24mm; height:6.5mm; vertical-align:middle; text-align: left;"><strong>โอนเงิน/Transfer</strong></td>
        <td style="width:30mm; height:6.5mm; padding-left: 5px; vertical-align: middle;"><strong>เลขที่บัญชี/Account Number</strong></td>
        <td style="width:40mm; height:6.5mm; padding-left: 5px; vertical-align: middle;" colspan="3"><?= preg_replace("/(\d{3})(\d{1})(\d{3})(\d{3})/", "$1-$2-$3-$4", $model->transfer_account_number) ?></td>
        <td style="width:30mm; height:6.5mm; padding-left: 5px; vertical-align: middle;"><strong>ธนาคาร สาขา/Bank Branch</strong></td>
        <td style="width:35mm; height:6.5mm; padding-left: 5px; vertical-align: middle;" colspan="2"><?= $model->transfer_bank_branch ?></td>
    </tr>
    <tr>
        <td style="width:6mm; height:6.5mm; text-align:center; vertical-align:middle;"><?= renderCheckboxImg($model->payment_method, 'credit') ?></td>
        <td style="width:24mm; height:6.5mm; vertical-align:middle; text-align: left;"><strong>บัตรเครดิตองค์กร/Credit</strong></td>
        <td style="width:6mm; height:6.5mm; text-align:center; vertical-align:middle;"><?= renderCheckboxImg($model->payment_method, 'cheque_bank') ?></td>
        <td style="width:24mm; height:6.5mm; vertical-align:middle; text-align: left;"><strong>เช็ค/Cheque</strong></td>
        <td style="width:30mm; height:6.5mm; padding-left: 5px; vertical-align: middle;"><strong>ธนาคาร สาขา/Bank Branch</strong></td>
        <td style="width:40mm; height:6.5mm; padding-left: 5px; vertical-align: middle;" colspan="3"><?= $model->cheque_bank_branch ?></td>
        <td style="width:20mm; height:6.5mm; padding-left: 5px; vertical-align: middle;"><strong>เช็คลงวันที่/Cheque Date</strong></td>
        <td style="width:35mm; height:6.5mm; padding-left: 5px; vertical-align: middle;" colspan="2"><?= ($model->payment_method === 'cheque_bank' && !empty($model->cheque_date) && $model->cheque_date !== '0000-00-00') ? date('d/m/Y', strtotime($model->cheque_date)) : '' ?></td>
    </tr>
</table>

<table class="table-expense" style="width:277mm; table-layout:fixed; border-collapse: collapse;">
    <thead>
        <tr style="height: 8mm;">
            <th rowspan="2" style="width:15mm;">วันที่เดินทาง</th>
            <th rowspan="2" style="width:18mm;">รหัสโครงการ</th>
            <th rowspan="2" style="width:38mm;">ชื่อโครงการ</th>
            <th rowspan="2" style="width:38mm;">การปฏิบัติงาน</th>
            <th rowspan="2" style="width:16mm;">จุดเริ่มต้น</th>
            <th rowspan="2" style="width:16mm;">จุดสิ้นสุด</th>
            <th colspan="2" style="width:22mm;">รายการอื่น ๆ</th>
            <th colspan="5" style="width:77mm;">ประเภทรถส่วนตัว: รถยนต์ A, รถยนต์ไฟฟ้า B, รถจักรยานยนต์ C</th>
            <th rowspan="2" style="width:22mm;">ยอดรวม</th>
        </tr>
        <tr style="height: 7mm;">
            <th style="width:14mm;">รายการ</th>
            <th style="width:8mm;">บาท</th>
            <th style="width:12mm;">ประเภท</th>
            <th style="width:15mm;">เลขไมล์เริ่มต้น</th>
            <th style="width:15mm;">เลขไมล์สิ้นสุด</th>
            <th style="width:15mm;">ระยะทาง (กม.)</th>
            <th style="width:20mm;">บาท</th>
        </tr>
    </thead>
    <tbody>
        <?php
        $items_array = $items ?? [];
        $total_other_price = $total_distance = $total_travel_price = $total_amount = 0;
        $usedHeight = 0;

        foreach ($items_array as $idx => $item):
            $total_other_price += ($item->other_items_price ?? 0);
            $total_distance += ($item->distance ?? 0);
            $total_travel_price += ($item->travel_price ?? 0);
            $total_amount += ($item->amount ?? 0);
            
            $pNameRes = Yii::$app->forms->splitTextByWidth($mpdf, $item->project->name ?? '', 36, 'thsarabun', 9);
            $pDescRes = Yii::$app->forms->splitTextByWidth($mpdf, $item->description ?? '', 36, 'thsarabun', 9);
            $lineCount = max(($pNameRes['line_count'] ?? 1), ($pDescRes['line_count'] ?? 1));
            
            $hRow = max(($lineCount * 4.5), $avgRowHeight);
            $usedHeight += $hRow;
        ?>
        <tr style="height:<?= $hRow ?>mm;">
            <td style="text-align:center;"><?= date('d/M/Y', strtotime($item->item_date)) ?></td>
            <td style="text-align:center;"><?= $item->project->code ?? '' ?></td>
            <td style="text-align: left; padding: 0 2px;"><?= !empty($pNameRes['lines']) ? implode('<br>', $pNameRes['lines']) : ($item->project->name ?? '-') ?></td>
            <td style="text-align: left; padding: 0 2px;"><?= !empty($pDescRes['lines']) ? implode('<br>', $pDescRes['lines']) : ($item->description ?? '-') ?></td>
            <td style="text-align:center;"><?= !empty(trim($item->travel_start)) ? $item->travel_start : '-' ?></td>
            <td style="text-align:center;"><?= !empty(trim($item->travel_end)) ? $item->travel_end : '-' ?></td>
            <td style="text-align:left;"><?= !empty(trim($item->other_items)) ? $item->other_items : '-' ?></td>
            <td class="text-right-lock"><?= number_format($item->other_items_price ?? 0, 2) ?></td>
            <td style="text-align:center;"><?= !empty(trim($item->car_type)) ? $item->car_type : '-' ?></td>
            <td style="text-align:center;"><?= number_format($item->starting_mileage ?? 0) ?></td>
            <td style="text-align:center;"><?= number_format($item->end_mileage ?? 0) ?></td>
            <td class="text-right-lock"><?= number_format($item->distance ?? 0, 2) ?></td>
            <td class="text-right-lock"><?= number_format($item->travel_price ?? 0, 2) ?></td>
            <td class="text-right-lock"><?= number_format($item->amount ?? 0, 2) ?></td>
        </tr>
        <?php endforeach; ?>

        <?php
        $remainingSpace = $contentHeight - $usedHeight;
        $minFillHeight = 6.5;
        if ($remainingSpace > $minFillHeight) {
            $fillRows = floor($remainingSpace / $minFillHeight);
            $hRowEmpty = $remainingSpace / $fillRows;
            for ($i = 0; $i < $fillRows; $i++): ?>
                <tr style="height:<?= number_format($hRowEmpty, 4) ?>mm;">
                    <?php for ($j = 0; $j < 14; $j++): ?><td>&nbsp;</td><?php endfor; ?>
                </tr>
            <?php endfor;
        } ?>

        <tr style="font-weight:bold; height: 10mm; background-color: #fff;">
            <td colspan="4" style="border-top:1px solid #000; text-align:center;">สรุปค่าใช้จ่ายในการค่าเดินทางไปปฏิบัติงาน</td>
            <td colspan="3" style="border-top:1px solid #000; text-align:center;"><?= !empty($total_amount) ? ReadPrice::convert($total_amount) : 'ศูนย์บาทถ้วน' ?></td>
            <td class="text-right-lock" style="border-top:1px solid #000;"><?= number_format($total_other_price, 2) ?></td>
            <td style="border-top:1px solid #000; border-right:1px solid #000; background:#d9d9d9; width: 50px;"></td>
            <td style="border-top:1px solid #000; border-right:1px solid #000; background:#d9d9d9; width: 50px;"></td>
            <td style="border-top:1px solid #000; border-right:1px solid #000; background:#d9d9d9; width: 50px;"></td>
            <td class="text-right-lock" style="border-top:1px solid #000;"><?= number_format($total_distance, 2) ?></td>
            <td class="text-right-lock" style="border-top:1px solid #000;"><?= number_format($total_travel_price, 2) ?></td>
            <td class="text-right-lock" style="border-top:1px solid #000;"><?= number_format($total_amount, 2) ?></td>
        </tr>
    </tbody>
</table>

<table class="table-expense-body" style="width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: -1px;">
    <tr>
        <td rowspan="4" style="width: 67%; vertical-align: top; text-align: left; font-size: 7.5pt; border: 1px solid #000; padding: 4px 6px; line-height: 1.15;">
            <strong style="font-size: 8.5pt;">หมายเหตุ Remark:</strong><br>
            1. กรุณาแนบรูปถ่ายเลขไมล์, Google map, ใบเสร็จค่าใช้จ่ายค่าน้ำมัน ค่าชาร์จไฟ ค่าไฟฟ้า ค่าใช้จ่ายอื่นๆ ในนามบริษัทฯ เพื่อเปรียบเทียบระหว่างยอดรวมใบเสร็จค่าน้ำมันกับค่าเดินทางตามระยะทาง โดยบริษัทฯจะจ่ายยอดที่น้อยกว่า ทั้งนี้ต้องเบิกภายในรอบเดือนเท่านั้น<br>
            2. หากไม่สามารถออกใบเสร็จได้ กรุณาแนบรูปถ่ายหรือแสดงหลักฐาน พร้อมแนบใบรับรองแทนใบเสร็จด้วยทุกครั้ง<br>
            3. การเบิกค่าใช้จ่าย ที่ไม่สอดคล้องกับระเบียบปฏิบัติหรือข้อเท็จจริง จะถูกพิจารณาโทษทางวินัย เลิกสัญญา จ้างโดยไม่จ่ายค่าชดเชยใดๆทั้งสิ้น
        </td>
        <td colspan="2" style="width: 19%; height:5.5mm; text-align: right; font-size: 8.5pt; border: 1px solid #000; padding-right: 5px;"><strong>รวมใบเสร็จค่าน้ำมัน,ค่าไฟฟ้า (ระบุ)</strong></td>
        <td style="width: 14%; height:5.5mm; text-align: right; border: 1px solid #000; padding-right: 5px; font-size: 8.5pt;"><strong><?= number_format($model->total_receipt_amount, 2) ?></strong></td>
    </tr>
    <tr>
        <td colspan="2" style="height:5.5mm; text-align: right; font-size: 8.5pt; border: 1px solid #000; padding-right: 5px;"><strong>รวมค่าเดินทางตามระยะทาง</strong></td>
        <td style="height:5.5mm; text-align: right; border: 1px solid #000; padding-right: 5px; font-size: 8.5pt;"><strong><?= number_format($model->total_mileage_expense, 2) ?></strong></td>
    </tr>
    <tr>
        <td colspan="2" style="height:5.5mm; text-align: right; font-size: 8.5pt; border: 1px solid #000; padding-right: 5px;"><strong>รวมค่าใช้จ่ายอื่นๆ</strong></td>
        <td style="height:5.5mm; text-align: right; border: 1px solid #000; padding-right: 5px; font-size: 8.5pt;"><strong><?= number_format($model->total_other_expense, 2) ?></strong></td>
    </tr>
    <tr>
        <td colspan="2" style="height:5.5mm; text-align: right; font-size: 8.5pt; border: 1px solid #000; padding-right: 5px;"><strong>รวมค่าใช้จ่ายทั้งหมด</strong></td>
        <td style="height:5.5mm; text-align: right; border: 1px solid #000; padding-right: 5px; font-size: 8.5pt; background-color: #d9d9d9;"><strong><?= number_format($model->total_grand, 2) ?></strong></td>
    </tr>
</table>

<table class="table-expense-body" style="width:100%; border-collapse:collapse; table-layout:fixed; line-height: 1.1; margin-top: -1px;">
    <tr>
        <th style="width:20%; height:5mm; border: 1px solid #000; font-weight:bold; padding: 2px; vertical-align: middle; font-size: 8.5pt; background-color: #f5f5f5;">ผู้ขอเบิก/Requested by</th>
        <th style="width:20%; height:5mm; border: 1px solid #000; font-weight:bold; padding: 2px; vertical-align: middle; font-size: 8.5pt; background-color: #f5f5f5;">ผู้จัดการฝ่าย/Manager</th>
        <th style="width:20%; height:5mm; border: 1px solid #000; font-weight:bold; padding: 2px; vertical-align: middle; font-size: 8.5pt; background-color: #f5f5f5;">เจ้าหน้าที่ตรวจสอบ /Verified by</th>
        <th style="width:20%; height:5mm; border: 1px solid #000; font-weight:bold; padding: 2px; vertical-align: middle; font-size: 8.5pt; background-color: #f5f5f5;">ผู้จัดการตรวจสอบ /Verified by</th>
        <th style="width:20%; height:5mm; border: 1px solid #000; font-weight:bold; padding: 2px; vertical-align: middle; font-size: 8.5pt; background-color: #f5f5f5;">ผู้อนุมัติ/Authorized by</th>
    </tr>
    <tr>
        <?php for($i=1; $i<=5; $i++): ?>
        <td style="height:11mm; text-align: center; border: 1px solid #000; border-bottom:none !important; vertical-align: middle;">
            <?= $model->getSignatureImg($i) ?>
        </td>
        <?php endfor; ?>
    </tr>
    <tr>
        <?php for($i=1; $i<=5; $i++): ?>
        <td style="height:5mm; text-align: left; border: 1px solid #000; border-top: none !important; padding: 1px 3px; font-size: 8pt;">
            ลงชื่อ/Signature 
            <span style="font-size: 8pt; margin-left: 5px;">
                <?= $model->getSignatureImg($i) ? '&nbsp;&nbsp;(' . $model->getApprovalName($i) . ')' : '' ?>
            </span>
        </td>
        <?php endfor; ?>
    </tr>
    <tr>
        <?php for($i=1; $i<=5; $i++): 
            $d = $model->getApprovalDate($i);
            $dateObj = DateTime::createFromFormat('d/M/Y', $d);
        ?>
        <td style="height:4mm; border: 1px solid #000; text-align: left; padding: 1px 3px; vertical-align: middle; font-size: 8pt;">
            วันที่/Date <?= ($dateObj) ? $dateObj->format('d/m/Y') : '' ?>
        </td>
        <?php endfor; ?>
    </tr>
</table>