<?php

use app\components\MyComponent;
use app\models\Files;
use app\models\TravelExpense;
use yii\helpers\Html;
use app\libs\Constant;
use yii\helpers\Url;
use yii\web\View;
use yii\widgets\Pjax;
use yii\data\ActiveDataProvider;

$this->title = Yii::t('travel_expense', 'Travel Expense Request');
$this->params['breadcrumbs'][] = ['label' => $this->title, 'template' => "<li class=\"breadcrumb-item\"><h4>{link} (" . $dataProvider->getCount() . ")</h4></li>\n"];

$curYear = date("Y");
$selectedYear = Yii::$app->request->get('selectYear') ?? 'all';
$oldYear = date("Y") - 3;
$paymentMethodsTh = Constant::TYPE_PAYMENTS_TH; 
$expenseStatuses = Constant::STATUS_EXPENSE;
$statusColors = Constant::STATUS_EXPENSE_COLORS;

$STATUS_DRAFT = Constant::STATUS_EXPENSE_DRAFT;
$STATUS_APPROVED = Constant::STATUS_EXPENSE_APPROVED;
$STATUS_REJECTED = Constant::STATUS_EXPENSE_REJECTED;
$STATUS_WAITING_FOR_APPROVAL = Constant::STATUS_EXPENSE_WAITING_MANAGER_RECEIVER;

$checkSetDoc = \app\models\SettingDocument::find()
    ->where(['doc_type' => 'TRAVEL-EXPENSE', 'type' => 'DOCUMENT_CODE'])
    ->one();
$isDocReady = ($checkSetDoc && !empty(trim($checkSetDoc->value))) ? 1 : 0;

?>

<div class="row">
    <div class="col-12">
        <div class="card">
            <div class="card-body">
                <h1>
                    <div class="row">
                        <div class="col-12">
                            <?php
                            echo Html::a('<i class="mdi mdi-plus-circle-outline"></i> ' . Yii::t('app', 'Create Travel Expense Request'), ['create'], ['class' => 'btn btn-outline-primary waves-effect waves-light']);
                            ?>

                            <a href="<?= Url::to(['export', 'selectYear' => $selectedYear]) ?>" class="btn btn-outline-primary waves-effect waves-light">
                                <i class="mdi mdi-microsoft-excel"></i> <?= Yii::t('app', 'Export (Excel)') ?>
                            </a>
                            <form method="GET" style="display: inline-flex;float: right;">
                                <label class="la">เลือกปี : </label>
                                <select class="sel form-select" name="selectYear" onchange="this.form.submit()">
                                    <?php
                                    echo '<option value="all" ' . ('all' === $selectedYear ? 'selected' : '') . '>All</option>';
                                    for ($y = $oldYear; $y <= $curYear; $y++) {
                                        echo '<option value="' . $y . '" ' . ($y == $selectedYear ? 'selected' : '') . ' >' . $y . '</option>';
                                    }
                                    ?>
                                </select>
                            </form>
                        </div>
                    </div>
                </h1>
                
                <?php Pjax::begin(['id' => 'travel-expense-request-pjax-container']); ?>
                
                <table id="tb-expense-request" class="table table-sm m-0 table-bordered dt-responsive w-100 rounded-1">
                    <thead class="tb-list-head">
                        <tr>
                            <th class="text-center tb-head-item tb-list-no"><?= Yii::t('app', 'No.') ?></th>
                            <th class="text-center tb-head-item"><?= Yii::t('travel_expense', 'Travel Expense Code') ?></th> 
                            <th class="text-center tb-head-item" style="width:150px;"><?= Yii::t('app', 'Purpose') ?></th>
                            <th class="text-center tb-head-item"><?= Yii::t('app', 'Date') ?></th>
                            <th class="text-center tb-head-item"><?= Yii::t('app', 'Withdrawal Type') ?></th>
                            <th class="text-center tb-head-item"><?= Yii::t('app', 'Total Amount') ?></th>
                            <th class="text-center tb-head-item"><?= Yii::t('app', 'Requested By') ?></th>
                            <th class="text-center tb-head-item"><?= Yii::t('app', 'Employee') ?></th>
                            <th class="text-center tb-head-item"><?= Yii::t('app', 'Approved Date') ?></th>
                            <th class="text-center tb-head-item"><?= Yii::t('app', 'File') ?></th> 
                            <th class="text-center tb-head-item" style="width:100px;"><?= Yii::t('app', 'Status') ?></th>
                            <th class="text-center tb-end-head-item tb-head-icon sorting_disabled"><i class="mdi mdi-cog-outline mdi-14px" style="font-size:14px ;color:#163fe4;width:74px;"></i></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php 
                        foreach ($dataProvider->getModels() as $key => $item) {
                            $firstName = $item['requestor']['first_name'] ?? '';
                            $lastName = $item['requestor']['last_name'] ?? '';
                            $requestedByName = trim($firstName . ' ' . $lastName);
                            $requestedByName = !empty($requestedByName) ? $requestedByName : '-';

                            $empFN = $item['emp_first_name'] ?? '';
                            $empLN = $item['emp_last_name'] ?? '';
                            $employeeFullName = trim($empFN . ' ' . $empLN);
                            $employeeFullName = !empty($employeeFullName) ? $employeeFullName : '-';

                            $rawPaymentMethod = strtolower($item['payment_method'] ?? '');
                            $withdrawalType = $paymentMethodsTh[$rawPaymentMethod] ?? ($item['payment_method'] ?? '-');

                            $approvedAtRaw = (isset($item['approved_date_l5']) && !empty($item['approved_date_l5'])) 
                            ? strtotime($item['approved_date_l5']) 
                            : 0;

                            $approvedAtFormatted = ($approvedAtRaw > 0) 
                                ? date('d/m/Y', $approvedAtRaw) 
                                : '-';

                            $statusSortValue = isset($item['status']) ? $item['status'] : $STATUS_DRAFT;

                            $rowClassMapping = [
                                Constant::STATUS_EXPENSE_DRAFT => 'row-draft',
                                Constant::STATUS_EXPENSE_WAITING_MANAGER_RECEIVER => 'row-warning-soft',
                                Constant::STATUS_EXPENSE_WAITING_CHECKER => 'row-indigo-soft',
                                Constant::STATUS_EXPENSE_WAITING_MANAGER_CHECKER => 'row-purple-soft',
                                Constant::STATUS_EXPENSE_WAITING_APPROVER => 'row-brown-soft',
                                Constant::STATUS_EXPENSE_APPROVED => 'row-success-soft',
                                Constant::STATUS_EXPENSE_REJECTED => 'row-danger-soft',
                            ];
                            $rowColorClass = $rowClassMapping[$statusSortValue] ?? '';

                            $statusText = $expenseStatuses[$statusSortValue] ?? Yii::t('app', 'Unknown');
                            $statusClass = $statusColors[$statusSortValue] ?? 'btn-secondary';

                            $purposeText = $item['purpose'] ?? '-'; 
                            $icon = Files::instance()->getCountFile(TravelExpense::class, $item['id']) ? "mdi mdi-text-box-search-outline mdi-18px" : "mdi mdi-file-plus mdi-18px";
                            $fileCellHtml = '<td class="text-center tb-list-body"><a href="javascript:void(0)" class="view-files" data-url="' . Url::to(['file/list', 'tableName' => TravelExpense::class]) . '" data-id="' . $item['id'] . '" data-code="' . $item['code'] . '"><i class="' . $icon . '"></i></a></td>';
                            
                            $buttonText = $item['buttonText'] ?? Yii::t('app', 'รายละเอียด');
                        ?>
                            <tr class="<?= $rowColorClass ?>">
                                <td class="text-center tb-list-body tb-list-no" data-order="<?= $key + 1 ?>"></td>
                                <td class="text-center tb-list-body" data-order="<?= $item['code'] ?>"><?= Html::a($item['code'], ['update', 'id' => $item['id']]) ?></td>
                                <td class="text-center tb-list-body" style="text-align: left; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="<?= Html::encode($purposeText) ?>"><?= Html::encode($purposeText) ?></td>
                                <td class="text-center tb-list-body" data-order="<?= strtotime($item['request_date'] ?? '') ?>">
                                    <?php
                                    $timestamp = strtotime($item['request_date'] ?? '');
                                    echo ($timestamp !== false && $timestamp > 0) ? date('d/m/Y', $timestamp) : '-';
                                    ?>
                                </td>
                                <td class="text-center tb-list-body"><?= $withdrawalType ?></td>
                                <td class="text-center tb-list-body" data-order="<?= $item['total_grand'] ?? 0 ?>"><?= number_format($item['total_grand'] ?? 0, 2) ?></td> 
                                <td class="text-center tb-list-body"><?= $requestedByName ?></td>
                                <td class="text-center tb-list-body"><?= Html::encode($employeeFullName) ?></td>
                                <td class="text-center tb-list-body" data-order='<?= $approvedAtRaw ?>'><?= $approvedAtFormatted ?></td>

                                <?= $fileCellHtml ?> 
                                <td class="text-center tb-list-body" data-order='<?= $statusSortValue ?>'>
                                    <button class="btn <?= $statusClass ?> btn-sm" type="button" style="cursor: default; pointer-events: none;">
                                        <?= $statusText ?>
                                    </button>
                                </td>
                                <td class="text-center">
                                    <div class="dropdown">
                                        <button class="btn btn-secondary dropdown-toggle btn-sm" type="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                            <i class="mdi mdi-chevron-down"></i>
                                        </button>
                                        <div class="dropdown-menu">
                                        <?php 
                                            if ($buttonText === Yii::t('app', 'แก้ไข')) {
                                                $iconClass = 'mdi mdi-lead-pencil';
                                            } elseif ($buttonText === Yii::t('app', 'ตรวจสอบ')) {
                                                $iconClass = 'mdi mdi-magnify';
                                            } else {
                                                $iconClass = 'mdi mdi-eye';
                                            }
                                            ?>

                                            <a class="dropdown-item" href="<?= Url::to(['update', 'id' => $item['id']]) ?>"> 
                                                <i class="<?= $iconClass ?>"></i> <?= $buttonText ?>
                                            </a>
                                            <a class="dropdown-item btn-preview-pdf" 
                                               href="javascript:void(0);" 
                                               data-ready="<?= $isDocReady ?>"
                                               data-url="<?= Url::to(['travel-expense/pdf', 'id' => $item['id']]) ?>">
                                                 <i class="mdi mdi-file-find-outline"></i> <?= Yii::t('app', 'Preview') ?>
                                            </a>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        <?php } ?>
                    </tbody>
                </table>

                <?php Pjax::end(); ?>

            </div>
        </div>
    </div>
</div>

<?= $this->render('/common/modal_upload_file', [
    'action' => ['/file/upload-files', 'tableName' => TravelExpense::class, 'title' => $this->title], 
    'titleFile' => $this->title,
    'pathFile' => Yii::getAlias('@webroot/uploads/travel-expense/files/'),
]) ?>

<div class="modal fade modal-md" id="remark-modal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header py-3 px-4 border-bottom-0">
                <h5 class="modal-title" id="modal-title"><?= Yii::t('app', 'Remark') ?></h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-hidden="true"></button>
            </div>
            <div class="modal-body">
                <div class="shadow-none p-2 bg-light rounded" style="height: 300px">
                    <span id="txt-remark" style="font-size: 14px;"></span>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
    var statusData = <?= json_encode($expenseStatuses) ?>;
    var canManageRequest = <?php echo (int)Yii::$app->user->can('manageTravelExpenseRequest') ?>;
    var STATUS_DRAFT = '<?php echo $STATUS_DRAFT ?>';
    var STATUS_APPROVED = '<?php echo $STATUS_APPROVED ?>';
    var STATUS_REJECTED = '<?php echo $STATUS_REJECTED ?>';
    var STATUS_WAITING = '<?php echo $STATUS_WAITING_FOR_APPROVAL ?>';
    var isDocSettingReady = <?= $isDocReady ?>;
</script>

<?php
$urlChangeStatus = Url::to(['change-status']);
$pathDownload = Yii::getAlias('@web/uploads/travel-expense/files/');
$urlDelete = Url::to(['file/delete-file']);
$roleNameParam = $roleName ?? '';

$script = <<< JS
var urlChangeStatus = '{$urlChangeStatus}';
$(document).ready(function(){
    $('#tb-expense-request').DataTable({
        "paging": true,
        "lengthChange": true,
        "searching": true,
        "ordering": true,
        "info": true,
        "autoWidth": false,
        "responsive": true,
        "language": getTHDataTable(),
        "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "All"] ],
        "pageLength": 10,
        "columnDefs": [
            { "orderable": false, "targets": [0, 9, 11] }, 
        ],
        "drawCallback": function( settings ) {
            var api = this.api();
            var pageInfo = api.page.info();
            var start = pageInfo.start;
            api.column(0, {page:'current'}).nodes().each( function (cell, i) {
                cell.innerHTML = start + i + 1;
            } );
        }
    });

    $(document).on("click", ".change-status", function(e) {
        e.preventDefault();
        var id = $(this).data('id');
        var newStatus = $(this).data('status');
        var statusName = $(this).data('status-name');

        Swal.fire({
            title: 'ยืนยันการเปลี่ยนสถานะ?',
            text: "ต้องการเปลี่ยนสถานะของรหัสคำขอค่าใช้จ่ายนี้เป็น \"" + statusName + "\" ใช่หรือไม่?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#198754',
            cancelButtonColor: '#d33',
            confirmButtonText: 'ตกลง',
            cancelButtonText: 'ยกเลิก'
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: 'กำลังดำเนินการ...',
                    allowOutsideClick: false,
                    didOpen: () => { Swal.showLoading() }
                });

                $.post(urlChangeStatus, {
                    id: id,
                    status: newStatus,
                    _csrf: yii.getCsrfToken() 
                }, function(response) {
                    Swal.close();
                    if (response.success) {
                        Swal.fire('เปลี่ยนสถานะแล้ว!', 'สถานะถูกเปลี่ยนเป็น "' + statusName + '" เรียบร้อยแล้ว', 'success').then(() => {
                            $.pjax.reload({container: '#travel-expense-request-pjax-container'});
                        });
                    } else {
                        Swal.fire('เกิดข้อผิดพลาด!', response.message || 'ไม่สามารถเปลี่ยนสถานะได้', 'error');
                    }
                }).fail(function() {
                    Swal.close();
                    Swal.fire('เกิดข้อผิดพลาด!', 'การเชื่อมต่อล้มเหลว', 'error');
                });
            }
        });
    });

    $(document).on('click','.view-files',function(){
        const url = $(this).data('url');
        const id = $(this).data('id');
        const code = $(this).data('code');
        $('#id').val(id);
        $('#pr_code').text(code); 
        const options = {url:url,id:id,download:'$pathDownload',delete:'$urlDelete'};
        getFiles(options);
    });

    $(document).on('click', '.btn-preview-pdf', function(e) {
        e.preventDefault();
        var pdfUrl = $(this).data('url');
        var isReady = $(this).data('ready');

        if (isReady == 0) {
            Swal.fire({
                title: 'แจ้งเตือน',
                text: 'ยังไม่ได้ตั้งค่ารหัสเอกสารในระบบกรุณาติดต่อผู้ดูแลระบบเพื่อตั้งค่าก่อนดูเอกสาร',
                icon: 'error',
                confirmButtonColor: '#163fe4',
                confirmButtonText: 'ตกลง'
            });
        } else {
            window.open(pdfUrl, '_blank');
        }
    });
});
JS;
$this->registerJs($script, View::POS_END);
?>

<style>
    .swal2-html-container {
        font-size: 14px !important;
    }

    .swal2-title {
        font-size: 18px !important;
    }

    #tb-expense-request {
        border: 1px solid black !important;
    }

    #tb-expense-request tbody tr.row-draft td { 
        background-color: #f2f2f2 !important;
        color: #6c757d !important;
        border-bottom: 1px solid #ced4da !important;
    }
    
    
    #tb-expense-request tbody tr.row-warning-soft td { 
        background-color: rgba(255, 243, 205, 0.6) !important; 
        border-bottom: 1px solid #ffc107 !important;
    }
    
    #tb-expense-request tbody tr.row-indigo-soft td { 
        background-color: rgba(225, 235, 250, 0.7) !important; 
        border-bottom: 1px solid #0d6efd !important;
    }
    
    #tb-expense-request tbody tr.row-purple-soft td { 
        background-color: rgba(230, 220, 245, 0.7) !important; 
        border-bottom: 1px solid #6f42c1 !important;
    }
    
    #tb-expense-request tbody tr.row-brown-soft td { 
        background-color: rgba(235, 225, 215, 0.9) !important; 
        border-bottom: 1px solid #856404 !important;
    }
    
    #tb-expense-request tbody tr.row-success-soft td { 
        background-color: rgba(209, 231, 221, 0.6) !important; 
        border-bottom: 1px solid #198754 !important;
    }
    
    #tb-expense-request tbody tr.row-danger-soft td { 
        background-color: rgba(248, 215, 218, 0.6) !important; 
        border-bottom: 1px solid #dc3545 !important;
    }

    #tb-expense-request tbody tr:last-child td {
        border-bottom: 1px solid black !important;
    }

    .table-bordered > :not(caption) > * > * {
        box-shadow: none !important;
    }
</style>