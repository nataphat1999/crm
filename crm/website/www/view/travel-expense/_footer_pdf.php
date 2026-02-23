<?php
use app\libs\Constant;
use app\components\ReadPrice;
?>

<table class="table-expense-body" style="width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: -1px;">
    <tr>
        <td rowspan="4" style="width: 67%; vertical-align: top; text-align: left; font-size: 7pt; border: 1px solid #000; padding: 5px 8px; line-height: 1.3;">
            <strong style="font-size: 9pt;">หมายเหตุ Remark:</strong><br>
            1. กรุณาแนบรูปถ่ายเลขไมล์, Google map, ใบเสร็จค่าใช้จ่ายค่าน้ำมัน ค่าชาร์จไฟ ค่าไฟฟ้า ค่าใช้จ่ายอื่นๆ ในนามบริษัทฯ เพื่อเปรียบเทียบระหว่างยอดรวมใบเสร็จค่าน้ำมันกับค่าเดินทางตามระยะทาง โดยบริษัทฯจะจ่ายยอดที่น้อยกว่า ทั้งนี้ต้องเบิกภายในรอบเดือนเท่านั้น<br>
            2. หากไม่สามารถออกใบเสร็จได้ กรุณาแนบรูปถ่ายหรือแสดงหลักฐาน พร้อมแนบใบรับรองแทนใบเสร็จด้วยทุกครั้ง<br>
            3. การเบิกค่าใช้จ่าย ที่ไม่สอดคล้องกับระเบียบปฏิบัติหรือข้อเท็จจริง จะถูกพิจารณาโทษทางวินัย เลิกสัญญา จ้างโดยไม่จ่ายค่าชดเชยใดๆทั้งสิ้น
        </td>
        <td colspan="2" style="width: 19%; height:6mm; text-align: right; font-size: 9pt; border: 1px solid #000; padding-right: 5px;">
            <strong>รวมใบเสร็จค่าน้ำมัน,ค่าไฟฟ้า</strong>
        </td>
        <td style="width: 14%; height:6mm; text-align: right; border: 1px solid #000; padding-right: 5px; font-size: 9pt;">
            <strong><?= number_format($model->total_receipt_amount, 2, '.', ',') ?></strong>
        </td>
    </tr>
    <tr>
        <td colspan="2" style="height:6mm; text-align: right; font-size: 9pt; border: 1px solid #000; padding-right: 5px;">
            <strong>รวมค่าเดินทางตามระยะทาง</strong>
        </td>
        <td style="height:6mm; text-align: right; border: 1px solid #000; padding-right: 5px; font-size: 9pt;">
            <strong><?= number_format($model->total_mileage_expense, 2, '.', ',') ?></strong>
        </td>
    </tr>
    <tr>
        <td colspan="2" style="height:6mm; text-align: right; font-size: 9pt; border: 1px solid #000; padding-right: 5px;">
            <strong>รวมค่าใช้จ่ายอื่นๆ</strong>
        </td>
        <td style="height:6mm; text-align: right; border: 1px solid #000; padding-right: 5px; font-size: 9pt;">
            <strong><?= number_format($model->total_other_expense, 2, '.', ',') ?></strong>
        </td>
    </tr>
    <tr>
        <td colspan="2" style="height:6mm; text-align: right; font-size: 9pt; border: 1px solid #000; padding-right: 5px;">
            <strong>รวมค่าใช้จ่ายทั้งหมด</strong>
        </td>
        <td style="height:6mm; text-align: right; border: 1px solid #000; padding-right: 5px; font-size: 9pt; background-color: #d9d9d9;">
            <strong><?= number_format($model->total_grand, 2, '.', ',') ?></strong>
        </td>
    </tr>
</table>

<table class="table-expense-body" style="width:100%; border-collapse:collapse; table-layout:fixed; line-height: 1.2; margin-top: -1px;">
    <tr>
        <th style="width:20%; height:5mm; border: 1px solid #000; font-weight:bold; padding: 2px; vertical-align: middle; font-size: 9pt; background-color: #f5f5f5;">ผู้ขอเบิก/Requested by</th>
        <th style="width:20%; height:5mm; border: 1px solid #000; font-weight:bold; padding: 2px; vertical-align: middle; font-size: 9pt; background-color: #f5f5f5;">ผู้จัดการฝ่าย/Manager</th>
        <th style="width:20%; height:5mm; border: 1px solid #000; font-weight:bold; padding: 2px; vertical-align: middle; font-size: 9pt; background-color: #f5f5f5;">เจ้าหน้าที่ตรวจสอบ /Verified by</th>
        <th style="width:20%; height:5mm; border: 1px solid #000; font-weight:bold; padding: 2px; vertical-align: middle; font-size: 9pt; background-color: #f5f5f5;">ผู้จัดการตรวจสอบ /Verified by</th>
        <th style="width:20%; height:5mm; border: 1px solid #000; font-weight:bold; padding: 2px; vertical-align: middle; font-size: 9pt; background-color: #f5f5f5;">ผู้อนุมัติ/Authorized by</th>
    </tr>
    <tr>
        <td style="height:12mm; text-align: center; border: 1px solid #000; border-bottom:none !important; vertical-align: middle;">
            <?= $model->getSignatureImg(1) ?>
        </td>
        <td style="height:12mm; text-align: center; border: 1px solid #000; border-bottom:none !important; vertical-align: middle;">
            <?= $model->getSignatureImg(2) ?>
        </td>
        <td style="height:12mm; text-align: center; border: 1px solid #000; border-bottom:none !important; vertical-align: middle;">
            <?= $model->getSignatureImg(3) ?>
        </td>
        <td style="height:12mm; text-align: center; border: 1px solid #000; border-bottom:none !important; vertical-align: middle;">
            <?= $model->getSignatureImg(4) ?>
        </td>
        <td style="height:12mm; text-align: center; border: 1px solid #000; border-bottom:none !important; vertical-align: middle;">
            <?= $model->getSignatureImg(5) ?>
        </td>
    </tr>
    <tr>
        <td style="height:2mm; text-align: center; border: 1px solid #000; border-top:none !important; border-bottom:none !important; padding: 2px; font-size: 8pt;">
            <?= $model->getSignatureImg(1) ? '(' . $model->getApprovalName(1) . ')' : '' ?>
        </td>
        <td style="height:2mm; text-align: center; border: 1px solid #000; border-top:none !important; border-bottom:none !important; padding: 2px; font-size: 8pt;">
            <?= $model->getSignatureImg(2) ? '(' . $model->getApprovalName(2) . ')' : '' ?>
        </td>
        <td style="height:2mm; text-align: center; border: 1px solid #000; border-top:none !important; border-bottom:none !important; padding: 2px; font-size: 8pt;">
            <?= $model->getSignatureImg(3) ? '(' . $model->getApprovalName(3) . ')' : '' ?>
        </td>
        <td style="height:2mm; text-align: center; border: 1px solid #000; border-top:none !important; border-bottom:none !important; padding: 2px; font-size: 8pt;">
            <?= $model->getSignatureImg(4) ? '(' . $model->getApprovalName(4) . ')' : '' ?>
        </td>
        <td style="height:2mm; text-align: center; border: 1px solid #000; border-top:none !important; border-bottom:none !important; padding: 2px; font-size: 8pt;">
            <?= $model->getSignatureImg(5) ? '(' . $model->getApprovalName(5) . ')' : '' ?>
        </td>
    </tr>
    <tr>
        <td style="height:2mm; text-align: left; border: 1px solid #000; border-top:none !important; padding: 2px 4px; font-size: 9pt;">ลงชื่อ/Signature</td>
        <td style="height:2mm; text-align: left; border: 1px solid #000; border-top:none !important; padding: 2px 4px; font-size: 9pt;">ลงชื่อ/Signature</td>
        <td style="height:2mm; text-align: left; border: 1px solid #000; border-top:none !important; padding: 2px 4px; font-size: 9pt;">ลงชื่อ/Signature</td>
        <td style="height:2mm; text-align: left; border: 1px solid #000; border-top:none !important; padding: 2px 4px; font-size: 9pt;">ลงชื่อ/Signature</td>
        <td style="height:2mm; text-align: left; border: 1px solid #000; border-top:none !important; padding: 2px 4px; font-size: 9pt;">ลงชื่อ/Signature</td>
    </tr>
    <tr>
        <td style="height:5mm; border: 1px solid #000; text-align: left; padding: 2px 4px; vertical-align: middle; font-size: 9pt;">
            วันที่/Date <?php 
                $d1 = $model->getApprovalDate(1);
                $dateObj1 = DateTime::createFromFormat('d/M/Y', $d1);
                echo ($dateObj1) ? $dateObj1->format('d/m/Y') : ''; 
            ?>
        </td>
        <td style="height:5mm; border: 1px solid #000; text-align: left; padding: 2px 4px; vertical-align: middle; font-size: 9pt;">
            วันที่/Date <?php 
                $d2 = $model->getApprovalDate(2);
                $dateObj2 = DateTime::createFromFormat('d/M/Y', $d2);
                echo ($dateObj2) ? $dateObj2->format('d/m/Y') : ''; 
            ?>
        </td>
        <td style="height:5mm; border: 1px solid #000; text-align: left; padding: 2px 4px; vertical-align: middle; font-size: 9pt;">
            วันที่/Date <?php 
                $d3 = $model->getApprovalDate(3);
                $dateObj3 = DateTime::createFromFormat('d/M/Y', $d3);
                echo ($dateObj3) ? $dateObj3->format('d/m/Y') : ''; 
            ?>
        </td>
        <td style="height:5mm; border: 1px solid #000; text-align: left; padding: 2px 4px; vertical-align: middle; font-size: 9pt;">
            วันที่/Date <?php 
                $d4 = $model->getApprovalDate(4);
                $dateObj4 = DateTime::createFromFormat('d/M/Y', $d4);
                echo ($dateObj4) ? $dateObj4->format('d/m/Y') : ''; 
            ?>
        </td>
        <td style="height:5mm; border: 1px solid #000; text-align: left; padding: 2px 4px; vertical-align: middle; font-size: 9pt;">
            วันที่/Date <?php 
                $d5 = $model->getApprovalDate(5);
                $dateObj5 = DateTime::createFromFormat('d/M/Y', $d5);
                echo ($dateObj5) ? $dateObj5->format('d/m/Y') : ''; 
            ?>
        </td>
    </tr>
</table>