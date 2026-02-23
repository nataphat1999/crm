<?php
use app\components\MyComponent;

function renderCheckboxImg($value, $expected)
{
    $img = $value == $expected ? 'checked.png' : 'unchecked.png';
    return '<img src="' . Yii::getAlias('@webroot/images/icon/' . $img) . '" width="10" style="vertical-align:middle; margin-right:2px;">';
}
?>

<table class="table-expense" style="width:100%; border-collapse:collapse; table-layout:fixed; margin:0; font-size: 8pt; line-height: 1.0;" cellpadding="0" cellspacing="0">
    <tr>
        <td style="width:30mm; height:6.5mm; padding-left: 5px; vertical-align: middle;"><strong>ผู้ขอให้ดำเนินการ<br>Requestor</strong></td>
        <td style="width:60mm; height:6.5mm; border-right:none; padding-left: 5px; vertical-align: middle;" class="tb-txt-body"><?= $model->requestor->first_name ?> <?= $model->employee->last_name ?></td>
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
        <td style="width:6mm; height:6.5mm; text-align:center; vertical-align:middle;">
            <?= renderCheckboxImg($model->payment_method, 'cash') ?>
        </td>
        <td style="width:24mm; height:6.5mm; vertical-align:middle; text-align: left;"><strong>เงินสด/Cash</strong></td>
        <td style="width:6mm; height:6.5mm; text-align:center; vertical-align:middle;">
            <?= renderCheckboxImg($model->payment_method, 'bank_transfer') ?>
        </td>
        <td style="width:24mm; height:6.5mm; vertical-align:middle; text-align: left;"><strong>โอนเงิน/Transfer</strong></td>
        <td style="width:30mm; height:6.5mm; padding-left: 5px; vertical-align: middle;"><strong>เลขที่บัญชี/Account Number</strong></td>
        <td style="width:40mm; height:6.5mm; padding-left: 5px; vertical-align: middle;" colspan="3">
            <?= preg_replace("/(\d{3})(\d{1})(\d{3})(\d{3})/", "$1-$2-$3-$4", $model->transfer_account_number) ?>
        </td>
        <td style="width:30mm; height:6.5mm; padding-left: 5px; vertical-align: middle;"><strong>ธนาคาร สาขา/Bank Branch</strong></td>
        <td style="width:35mm; height:6.5mm; padding-left: 5px; vertical-align: middle;" colspan="2"><?= $model->transfer_bank_branch ?></td>
    </tr>
    <tr>
        <td style="width:6mm; height:6.5mm; text-align:center; vertical-align:middle;">
            <?= renderCheckboxImg($model->payment_method, 'credit') ?>
        </td>
        <td style="width:24mm; height:6.5mm; vertical-align:middle; text-align: left;"><strong>บัตรเครดิตองค์กร/Credit</strong></td>
        <td style="width:6mm; height:6.5mm; text-align:center; vertical-align:middle;">
            <?= renderCheckboxImg($model->payment_method, 'cheque_bank') ?>
        </td>
        <td style="width:24mm; height:6.5mm; vertical-align:middle; text-align: left;"><strong>เช็ค/Cheque</strong></td>
        <td style="width:30mm; height:6.5mm; padding-left: 5px; vertical-align: middle;"><strong>ธนาคาร สาขา/Bank Branch</strong></td>
        <td style="width:40mm; height:6.5mm; padding-left: 5px; vertical-align: middle;" colspan="3"><?= $model->cheque_bank_branch ?></td>
        <td style="width:20mm; height:6.5mm; padding-left: 5px; vertical-align: middle;"><strong>เช็คลงวันที่/Cheque Date</strong></td>
        <td style="width:35mm; height:6.5mm; padding-left: 5px; vertical-align: middle;" colspan="2">
        <?php
            if ($model->payment_method === 'cheque_bank' && !empty($model->cheque_date) && $model->cheque_date !== '0000-00-00') {
                echo date('d/M/Y', strtotime($model->cheque_date));
            } else {
                echo '';
            }
            ?>
        </td>
    </tr>
</table>