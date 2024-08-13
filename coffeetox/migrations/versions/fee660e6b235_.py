"""empty message

Revision ID: fee660e6b235
Revises: 545428bc1129
Create Date: 2024-08-12 16:13:07.737453

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'fee660e6b235'
down_revision = '545428bc1129'
branch_labels = None
depends_on = None

naming_convention = {
    "ix": 'ix_%(column_0_label)s',
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(column_0_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}



def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('playlist', schema=None, naming_convention=naming_convention) as batch_op:
        batch_op.add_column(sa.Column('creator_id', sa.Integer(), nullable=False))
        batch_op.drop_constraint('fk_playlist_author_id_user', type_='foreignkey')
        batch_op.create_foreign_key('fk_playlist_creator_id_user', 'user', ['creator_id'], ['id'])
        batch_op.drop_column('author_id')

    with op.batch_alter_table('soundtrack', schema=None, naming_convention=naming_convention) as batch_op:
        batch_op.add_column(sa.Column('author_name', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('uploaded_by_id', sa.Integer(), nullable=False))
        batch_op.drop_constraint('fk_soundtrack_author_id_user', type_='foreignkey')
        batch_op.create_foreign_key('fk_soundtrack_uploaded_by_id_user', 'user', ['uploaded_by_id'], ['id'])
        batch_op.drop_column('author_id')

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('soundtrack', schema=None, naming_convention=naming_convention) as batch_op:
        batch_op.add_column(sa.Column('author_id', sa.INTEGER(), nullable=False))
        batch_op.drop_constraint('fk_soundtrack_uploaded_by_id_user', type_='foreignkey')
        batch_op.create_foreign_key('fk_soundtrack_author_id_user', 'user', ['author_id'], ['id'])
        batch_op.drop_column('uploaded_by_id')
        batch_op.drop_column('author_name')

    with op.batch_alter_table('playlist', schema=None, naming_convention=naming_convention) as batch_op:
        batch_op.add_column(sa.Column('author_id', sa.INTEGER(), nullable=False))
        batch_op.drop_constraint('fk_playlist_creator_id_user', type_='foreignkey')
        batch_op.create_foreign_key('fk_playlist_author_id_user', 'user', ['author_id'], ['id'])
        batch_op.drop_column('creator_id')

    # ### end Alembic commands ###
