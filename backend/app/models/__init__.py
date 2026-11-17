# models package – import all models so SQLAlchemy registers them
from app.models.teacher import Teacher  # noqa
from app.models.background_job import BackgroundJob  # noqa
from app.models.exam import Exam  # noqa
from app.models.question import Question  # noqa
from app.models.answer_key import AnswerKey  # noqa
from app.models.student_submission import StudentSubmission  # noqa
from app.models.question_evaluation import QuestionEvaluation  # noqa
from app.models.audit_log import AuditLog  # noqa
